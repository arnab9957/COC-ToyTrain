import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, type TabMode } from './components/Navbar';
import { CameraSLMScreen } from './components/CameraSLMScreen';
import { RouteStatusBoardScreen } from './components/RouteStatusBoardScreen';
import { P2PMeshRelayScreen } from './components/P2PMeshRelayScreen';
import { GangmanPWayScreen } from './components/GangmanPWayScreen';
import { StorageDiagnosticsScreen } from './components/StorageDiagnosticsScreen';
import { db, initializeDatabaseSeed } from './db/schema';
import type { InspectionRecord, Language, TrackSection, EmergencyAlert } from './types';
import { yRoadStatusMap } from './services/meshSync';
import {
  initGatewayWebSocket,
  fetchGatewayReports,
  fetchGatewayAlerts,
  fetchGatewayTrackSections,
  syncReportToGateway,
  syncBatchToGateway
} from './services/gatewayClient';

export function App() {
  const [activeTab, setActiveTab] = useState<TabMode>('route-board');
  const [language, setLanguage] = useState<Language>('NE');
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [trackSections, setTrackSections] = useState<TrackSection[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);
  const [meshPeersCount, setMeshPeersCount] = useState<number>(8);
  const [isGatewayOnline, setIsGatewayOnline] = useState<boolean>(false);

  // Initialize database seed & Gateway bidirectional sync
  useEffect(() => {
    async function loadData() {
      await initializeDatabaseSeed();

      const loadedInspections = await db.inspections.toArray();
      const loadedSections = await db.trackSections.toArray();
      const loadedAlerts = await db.emergencyAlerts.toArray();

      setInspections(loadedInspections);
      setTrackSections(loadedSections);
      setEmergencyAlerts(loadedAlerts);

      loadedInspections.forEach((item) => {
        yRoadStatusMap.set(item.id, item);
      });

      // Try fetching existing reports from Station Gateway backend if accessible
      try {
        const remoteReports = await fetchGatewayReports();
        if (remoteReports && remoteReports.length > 0) {
          for (const rep of remoteReports) {
            await db.inspections.put(rep);
            yRoadStatusMap.set(rep.id, rep);
          }
          const allInspections = await db.inspections.toArray();
          setInspections(allInspections);
        }

        const remoteAlerts = await fetchGatewayAlerts();
        if (remoteAlerts && remoteAlerts.length > 0) {
          for (const alt of remoteAlerts) {
            await db.emergencyAlerts.put(alt);
          }
          setEmergencyAlerts(await db.emergencyAlerts.toArray());
        }

        const remoteSections = await fetchGatewayTrackSections();
        if (remoteSections && remoteSections.length > 0) {
          setTrackSections(remoteSections);
        }
      } catch (e) {
        console.log('[App] Offline fallback active:', e);
      }
    }

    loadData();

    // Observe local Yjs CRDT changes
    const yjsObserver = () => {
      const updatedList: InspectionRecord[] = [];
      yRoadStatusMap.forEach((val) => updatedList.push(val));
      if (updatedList.length > 0) {
        setInspections(updatedList);
      }
    };

    yRoadStatusMap.observe(yjsObserver);

    // Initialize Gateway WebSocket Connection
    const cleanupWs = initGatewayWebSocket({
      onPeerCount: (count) => {
        setMeshPeersCount(Math.max(count, 1));
      },
      onStatusChange: (online) => {
        setIsGatewayOnline(online);
      },
      onNewReport: async (record) => {
        console.log('[App] Received real-time report from Gateway Mesh:', record.id);
        await db.inspections.put(record);
        yRoadStatusMap.set(record.id, record);
        setInspections((prev) => [record, ...prev.filter((i) => i.id !== record.id)]);
      },
      onEmergencyAlert: async (alert) => {
        console.log('[App] Received real-time Emergency Alert from Gateway:', alert.title);
        await db.emergencyAlerts.put(alert);
        setEmergencyAlerts((prev) => [alert, ...prev.filter((a) => a.id !== alert.id)]);
      },
      onTrackUpdate: async (section) => {
        await db.trackSections.put(section);
        setTrackSections((prev) => prev.map((s) => (s.id === section.id ? section : s)));
      }
    });

    return () => {
      yRoadStatusMap.unobserve(yjsObserver);
      cleanupWs();
    };
  }, []);

  // Handle adding new inspection record (Camera AI or Gangman)
  const handleAddInspection = useCallback(async (record: InspectionRecord, photoArrayBuffer?: ArrayBuffer) => {
    // 1. Save to local IndexedDB
    await db.inspections.put(record);

    if (photoArrayBuffer) {
      await db.binaryAssets.put({
        photoHash: record.photoHash,
        data: photoArrayBuffer,
        contentType: 'image/jpeg'
      });
    }

    // 2. Queue for background sync
    await db.syncQueue.put({
      id: record.id,
      timestamp: record.timestamp,
      payload: record,
      retryCount: 0
    });

    // 3. Update local Yjs map & React state
    yRoadStatusMap.set(record.id, record);
    setInspections((prev) => [record, ...prev.filter((i) => i.id !== record.id)]);

    // 4. Opportunistically sync to station gateway
    syncReportToGateway(record).then((res) => {
      if (res && (res.status === 'ACCEPTED' || res.status === 'IDEMPOTENT_ALREADY_STORED')) {
        db.syncQueue.delete(record.id);
      }
    });
  }, []);

  const handleAddGangmanReport = useCallback(async (record: InspectionRecord) => {
    await handleAddInspection(record);
  }, [handleAddInspection]);

  // Handle physical gateway Wi-Fi sync simulation / trigger
  const handleSimulateStationSync = useCallback(async () => {
    try {
      const queuedItems = await db.syncQueue.toArray();
      const inspectionsToSync = queuedItems.length > 0 
        ? queuedItems 
        : inspections.slice(0, 10).map((r) => ({ id: r.id, timestamp: r.timestamp, payload: r }));

      if (inspectionsToSync.length > 0) {
        const result = await syncBatchToGateway(inspectionsToSync);
        if (result && result.status === 'ACCEPTED') {
          await db.syncQueue.clear();
          console.log('[App] Station Gateway Sync successful. Queued items flushed.');
        }
      }
    } catch (err) {
      console.warn('[App] Station Gateway sync error:', err);
    }
  }, [inspections]);

  return (
    <div className="min-h-screen bg-surface font-body-md text-on-surface flex flex-col selection:bg-primary selection:text-on-primary">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        meshPeersCount={meshPeersCount}
        storageFreePercent={92}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-gutter-mobile pt-28 pb-24 flex flex-col gap-gap-default">
        {activeTab === 'route-board' && (
          <RouteStatusBoardScreen
            inspections={inspections}
            language={language}
            onNavigateToMesh={() => setActiveTab('p2p-mesh')}
          />
        )}

        {activeTab === 'geo-camera' && (
          <CameraSLMScreen
            language={language}
            onAddInspection={handleAddInspection}
            onNavigateToMesh={() => setActiveTab('p2p-mesh')}
          />
        )}

        {activeTab === 'p2p-mesh' && <P2PMeshRelayScreen />}

        {activeTab === 'gangman-log' && (
          <GangmanPWayScreen
            language={language}
            sections={trackSections}
            inspections={inspections}
            onAddGangmanReport={handleAddGangmanReport}
            onSimulateStationSync={handleSimulateStationSync}
          />
        )}

        {activeTab === 'vault-diagnostics' && (
          <StorageDiagnosticsScreen inspections={inspections} />
        )}
      </main>

      <footer className="border-t border-outline-variant/30 bg-surface-container py-3 px-4 text-center font-label-sm text-label-sm text-on-surface-variant mb-16">
        <p>PahadSathi (पहाड साथी) — Offline Emergency Hill Safety System • Darjeeling Sector</p>
      </footer>
    </div>
  );
}
