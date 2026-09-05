import React, { useState, useEffect } from 'react';
import { Navbar, type TabMode } from './components/Navbar';
import { CameraSLMScreen } from './components/CameraSLMScreen';
import { RouteStatusBoardScreen } from './components/RouteStatusBoardScreen';
import { P2PMeshRelayScreen } from './components/P2PMeshRelayScreen';
import { GangmanPWayScreen } from './components/GangmanPWayScreen';
import { StorageDiagnosticsScreen } from './components/StorageDiagnosticsScreen';
import { db, initializeDatabaseSeed } from './db/schema';
import type { InspectionRecord, Language, TrackSection, EmergencyAlert } from './types';
import { yRoadStatusMap } from './services/meshSync';

export function App() {
  const [activeTab, setActiveTab] = useState<TabMode>('route-board');
  const [language, setLanguage] = useState<Language>('NE');
  const [inspections, setInspections] = useState<InspectionRecord[]>([]);
  const [trackSections, setTrackSections] = useState<TrackSection[]>([]);
  const [emergencyAlerts, setEmergencyAlerts] = useState<EmergencyAlert[]>([]);

  // Initialize database seed & Yjs synchronization
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
    }

    loadData();

    const yjsObserver = () => {
      const updatedList: InspectionRecord[] = [];
      yRoadStatusMap.forEach((val) => updatedList.push(val));
      if (updatedList.length > 0) {
        setInspections(updatedList);
      }
    };

    yRoadStatusMap.observe(yjsObserver);
    return () => yRoadStatusMap.unobserve(yjsObserver);
  }, []);

  const handleAddInspection = async (record: InspectionRecord, photoArrayBuffer?: ArrayBuffer) => {
    await db.inspections.put(record);

    if (photoArrayBuffer) {
      await db.binaryAssets.put({
        photoHash: record.photoHash,
        data: photoArrayBuffer,
        contentType: 'image/jpeg'
      });
    }

    yRoadStatusMap.set(record.id, record);
    setInspections((prev) => [record, ...prev.filter((i) => i.id !== record.id)]);
  };

  const handleAddGangmanReport = async (record: InspectionRecord) => {
    await handleAddInspection(record);
  };

  const handleSimulateStationSync = async () => {
    console.log('Simulating station gateway sync...');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-black flex flex-col font-mono selection:bg-blue-600 selection:text-white">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        language={language}
        setLanguage={setLanguage}
        meshPeersCount={8}
        storageFreePercent={92}
      />

      <main className="flex-1 max-w-2xl w-full mx-auto px-3 pt-20 pb-24 flex flex-col gap-4">
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

      <footer className="border-t-2 border-black bg-white py-3 px-4 text-center text-xs font-mono text-gray-700 mb-16">
        <p>PahadSathi (पहाड साथी) — Offline Emergency Hill Safety System • Darjeeling Sector</p>
      </footer>
    </div>
  );
}

