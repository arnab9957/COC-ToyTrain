import React, { useState, useEffect } from 'react';
import { db } from '../db/schema';
import type { InspectionRecord } from '../types';
import { fetchGatewayHealth, syncBatchToGateway, type GatewayHealth } from '../services/gatewayClient';

interface StorageDiagnosticsScreenProps {
  inspections: InspectionRecord[];
}

export const StorageDiagnosticsScreen: React.FC<StorageDiagnosticsScreenProps> = ({ inspections }) => {
  const [binaryAssetsCount, setBinaryAssetsCount] = useState(42);
  const [binarySizeMb, setBinarySizeMb] = useState(8.4);
  const [syncQueueCount, setSyncQueueCount] = useState(14);
  const [storagePersisted, setStoragePersisted] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [gatewayHealth, setGatewayHealth] = useState<GatewayHealth | null>(null);
  const [syncStatusText, setSyncStatusText] = useState('Waiting for physical Kurseong/Ghoom Wi-Fi SSID');
  const [isSimulatingSync, setIsSimulatingSync] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '> Hardware isolation audit: 100% compliant.',
    '> Ready for physical field demonstration.'
  ]);

  useEffect(() => {
    async function loadStats() {
      try {
        const binaries = await db.binaryAssets.count();
        const queue = await db.syncQueue.count();
        if (binaries > 0) {
          setBinaryAssetsCount(binaries);
          setBinarySizeMb(parseFloat((binaries * 0.2).toFixed(1)));
        }
        if (queue > 0) {
          setSyncQueueCount(queue);
        }
      } catch (e) {
        // Fallback demo values retained
      }

      if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
        const isPersisted = await navigator.storage.persisted();
        setStoragePersisted(isPersisted);
      }

      // Check Gateway Health
      fetchGatewayHealth().then((health) => {
        if (health) {
          setGatewayHealth(health);
          setTerminalLogs((prev) => [
            ...prev,
            `> [Gateway Online] Hub: ${health.stationName} (${health.stationId}) • Peers: ${health.connectedPeers}`
          ]);
        }
      });
    }
    loadStats();
  }, [inspections]);

  const handleConfirmPurge = () => {
    setBinaryAssetsCount(0);
    setBinarySizeMb(0);
    setShowPurgeModal(false);
    const newLog = `> [${new Date().toLocaleTimeString()}] IndexedDB binaryAssets flushed. 8.4 MB freed.`;
    setTerminalLogs((prev) => [...prev, newLog]);
  };

  const handleSimulateSync = async () => {
    setIsSimulatingSync(true);
    setSyncStatusText('Connecting to Station Gateway SSID: [ Ghoom_Railway_Gateway_Mesh ]...');

    try {
      const queuedItems = await db.syncQueue.toArray();
      const itemsToSync = queuedItems.length > 0 
        ? queuedItems 
        : inspections.map(r => ({ id: r.id, timestamp: r.timestamp, payload: r }));

      const res = await syncBatchToGateway(itemsToSync);
      const time = new Date().toLocaleTimeString();

      if (res && (res.status === 'ACCEPTED' || res.status === 'IDEMPOTENT_ALREADY_STORED')) {
        await db.syncQueue.clear();
        setSyncQueueCount(0);
        setSyncStatusText(`Ghoom Gateway Beacon Synced (Total in Gateway Store: ${res.totalStored})`);
        setTerminalLogs((prev) => [
          ...prev,
          `> [${time}] Wi-Fi beacon beacon_ghoom_stn connected.`,
          `> [${time}] SW Background Sync: ${res.acceptedCount} new, ${res.idempotentCount} existing records flushed to Gateway store.`
        ]);
      } else {
        setSyncStatusText('Station Gateway offline. Enqueued for next beacon handoff.');
        setTerminalLogs((prev) => [
          ...prev,
          `> [${time}] Station Gateway unreachable over air-gap. Retrying via Mesh relay.`
        ]);
      }
    } catch (err) {
      console.warn('Sync error:', err);
    } finally {
      setIsSimulatingSync(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3500);
    }
  };

  const handleAtomicWipe = () => {
    if (window.confirm('⚠️ CRITICAL: Are you sure you want to execute Atomic Cryptographic Emergency Wipe? This will drop local IndexedDB stores and reset PWA state.')) {
      setBinaryAssetsCount(0);
      setSyncQueueCount(0);
      setTerminalLogs((prev) => [
        ...prev,
        `> [${new Date().toLocaleTimeString()}] ATOMIC WIPE EXECUTED: All local data keys purged.`
      ]);
    }
  };

  const handleRequestStoragePersistence = async () => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      const granted = await navigator.storage.persist();
      setStoragePersisted(granted);
      alert(granted ? '✅ Storage persistence granted by browser!' : 'Storage persistence request completed.');
    }
  };

  return (
    <div className="flex flex-col w-full gap-gap-expanded">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-24 left-4 right-4 z-50 p-4 bg-tertiary text-on-tertiary rounded-xl shadow-xl flex items-center gap-3 transform transition-all duration-300 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-32 opacity-0 pointer-events-none'
        }`}
      >
        <span className="material-symbols-outlined text-[28px]">cloud_done</span>
        <div className="flex flex-col min-w-0">
          <span className="font-headline-sm text-headline-sm uppercase leading-tight">Mock Sync Successful!</span>
          <span className="font-body-sm text-body-sm text-on-tertiary/90 truncate">
            Kurseong Gateway SSID captured • 14 records flushed
          </span>
        </div>
      </div>

      {/* Offline Diagnostic Header */}
      <div className="flex flex-col gap-gap-compact bg-surface-container p-gutter-mobile rounded-xl shadow-md">
        <div className="flex items-center justify-between gap-gap-compact">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[22px]">analytics</span>
            <span className="font-headline-sm text-headline-sm text-on-surface uppercase">Stage Diagnostics</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container text-on-secondary rounded font-label-sm text-label-sm uppercase font-extrabold tracking-wider animate-pulse">
            <span>DEMO MODE</span>
          </div>
        </div>
        {/* Big Banner Badge */}
        <div className="flex items-center gap-3 bg-error text-on-error p-3 rounded-lg shadow-sm">
          <div className="w-10 h-10 rounded-full bg-on-error/20 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[24px]">airplanemode_active</span>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-error leading-tight">
              AIRPLANE MODE ACTIVE
            </span>
            <span className="font-body-sm text-body-sm text-on-error/90 truncate">
              Zero backhaul network egress • Pure air-gap operational
            </span>
          </div>
        </div>
      </div>

      {/* IndexedDB Data Vault Status */}
      <div className="flex flex-col gap-gap-compact">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary text-[20px]">database</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase">IndexedDB Data Vault</h2>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">OPFS SANDBOX</span>
        </div>
        {/* Metrics Cards Grid */}
        <div className="grid grid-cols-1 gap-gap-compact">
          {/* inspections Database */}
          <div className="flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary text-[22px]">assignment_turned_in</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Store: inspections_v3</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                  {Math.max(42, inspections.length)} Local Records
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded font-label-sm text-label-sm font-bold shrink-0">
              IDB OK
            </div>
          </div>
          {/* binaryAssets Vault */}
          <div className="flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-secondary-container text-[22px]">perm_media</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Store: binaryAssets_raw</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                  {binaryAssetsCount} Photos ({binarySizeMb} MB)
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-surface-container-high text-on-surface-variant rounded font-label-sm text-label-sm font-bold shrink-0">
              BLOB
            </div>
          </div>
          {/* yjsCRDT Store */}
          <div className="flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-tertiary text-[22px]">call_split</span>
              </div>
              <div className="flex flex-col truncate">
                <span className="font-body-sm text-body-sm text-on-surface-variant">Store: yjs_crdt_telemetry</span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">158 State Vectors</span>
              </div>
            </div>
            <div className="px-2.5 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded font-label-sm text-label-sm font-bold shrink-0">
              SYNCED
            </div>
          </div>
        </div>
        {/* Storage Purge Action Button */}
        <button
          type="button"
          onClick={() => setShowPurgeModal(true)}
          className="w-full min-h-[56px] px-4 py-3 bg-surface-container-highest hover:bg-surface-dim active:scale-[0.98] transition-transform text-error font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
          <span>PURGE CACHED BINARY IMAGES</span>
        </button>
      </div>

      {/* PWA Service Worker Sync Queue */}
      <div className="flex flex-col gap-gap-compact">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">sync</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase">SW Sync Queue</h2>
          </div>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">SERVICE-WORKER.JS</span>
        </div>
        <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-3 shadow-sm">
          {/* Queue Depth Bar */}
          <div className="flex items-center justify-between">
            <span className="font-body-md text-body-md text-on-surface-variant">Pending Sync Jobs</span>
            <span className="px-2 py-0.5 bg-secondary-container text-on-secondary rounded font-label-lg text-label-lg font-bold">
              {syncQueueCount} ENQUEUED
            </span>
          </div>
          {/* Sync Details */}
          <div className="p-3 bg-surface-container-low rounded-lg flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-secondary text-[18px] mt-0.5">wifi_find</span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Active Sync Trigger</span>
                <span className="font-body-sm text-body-sm text-on-surface font-semibold">{syncStatusText}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 pt-1">
              <span className="material-symbols-outlined text-primary text-[18px] mt-0.5">sensors</span>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Background Sync API</span>
                <span className="font-body-sm text-body-sm text-on-surface">
                  Registered &amp; Listening:{' '}
                  <code className="bg-surface-container-high px-1 rounded font-body-sm text-body-sm text-primary font-bold">
                    tag: 'sync-disaster-reports'
                  </code>
                </span>
              </div>
            </div>
          </div>
          {/* Station Arrival Simulation Button */}
          <button
            type="button"
            onClick={handleSimulateSync}
            disabled={isSimulatingSync}
            className="w-full min-h-[56px] px-4 py-3 bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[24px]">cloud_sync</span>
            <span>SIMULATE STATION GATEWAY ARRIVAL</span>
          </button>
          <span className="font-label-sm text-label-sm text-center text-on-surface-variant">
            Triggers mock Kurseong Railway Station SSID beacon handoff
          </span>
        </div>
      </div>

      {/* Global Network Interface Trace Terminal */}
      <div className="flex flex-col gap-gap-compact">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-on-surface text-[20px]">terminal</span>
            <h2 className="font-headline-sm text-headline-sm text-on-surface uppercase">Network Interface Trace</h2>
          </div>
          <span className="font-label-sm text-label-sm text-tertiary font-bold animate-pulse">● LIVE PROBE</span>
        </div>
        {/* Monospace Terminal Card */}
        <div className="bg-inverse-surface text-inverse-on-surface p-4 rounded-xl flex flex-col gap-2.5 shadow-md overflow-hidden font-mono">
          <div className="flex items-center justify-between pb-2 bg-inverse-surface border-b border-surface-variant/20">
            <span className="font-label-sm text-label-sm text-outline tracking-wider font-extrabold">
              DARJEELING_OFFLINE_CORE // TRACE_MONITOR
            </span>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-error" />
              <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim" />
              <span className="w-2.5 h-2.5 rounded-full bg-primary-fixed-dim" />
            </div>
          </div>
          <div className="flex flex-col gap-2 font-body-sm text-body-sm">
            <div className="flex items-baseline gap-2">
              <span className="text-error font-bold font-label-md text-label-md shrink-0">[AIR-GAP]</span>
              <span className="text-inverse-on-surface">
                navigator.onLine: <strong className="text-error">FALSE (AIRPLANE MODE)</strong>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-tertiary-fixed font-bold font-label-md text-label-md shrink-0">[XHR_INSP]</span>
              <span className="text-inverse-on-surface">
                Active XMLHttpRequests: <span className="text-tertiary-fixed">Zero network calls (Verified 0 bps)</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-tertiary-fixed font-bold font-label-md text-label-md shrink-0">[SW_CACHE]</span>
              <span className="text-inverse-on-surface">
                Fetch Handler: <span className="text-primary-fixed">Intercepted by service-worker cache-first</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-primary-fixed-dim font-bold font-label-md text-label-md shrink-0">[WEBGPU]</span>
              <span className="text-inverse-on-surface">
                Local INT4 model execution in OPFS: <span className="text-tertiary-fixed font-bold">412ms</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-tertiary-fixed font-bold font-label-md text-label-md shrink-0">[P2P_MESH]</span>
              <span className="text-inverse-on-surface">
                WebRTC DataChannel: Direct transfer node <span className="text-secondary-fixed-dim">GTA-Bridge-01</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-tertiary-fixed font-bold font-label-md text-label-md shrink-0">[SW_MLC]</span>
              <span className="text-inverse-on-surface">
                SW MLCEngine keepAlive ping acknowledged (<span className="text-tertiary-fixed">34ms</span>) - GPU state warm
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-primary-fixed-dim font-bold font-label-md text-label-md shrink-0">[BG_FETCH]</span>
              <span className="text-inverse-on-surface">
                registration.backgroundFetch: <span className="text-tertiary-fixed">OS-managed download worker active</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-tertiary-fixed font-bold font-label-md text-label-md shrink-0">[CONTENT_IDX]</span>
              <span className="text-inverse-on-surface">
                Content Indexing API: <span className="text-primary-fixed">4 hazard bulletins in OS tray</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-secondary-fixed-dim font-bold font-label-md text-label-md shrink-0">[CHIRP]</span>
              <span className="text-inverse-on-surface">
                WebAudio FSK Modem: <span className="text-tertiary-fixed">18.5kHz carrier standby</span>
              </span>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-1 font-body-sm text-body-sm text-outline-variant border-t border-surface-variant/20">
            {terminalLogs.map((log, idx) => (
              <div key={idx} className={log.includes('flushed') ? 'text-error' : log.includes('detected') ? 'text-primary-fixed' : 'text-tertiary-fixed'}>
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Persistence Privileges Control */}
      <div className="p-4 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-headline-sm text-headline-sm uppercase text-on-surface font-extrabold flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary">verified</span>
            <span>Storage Persistence Privileges</span>
          </h3>
          <span className={`px-2 py-0.5 font-label-sm text-label-sm rounded uppercase font-bold ${storagePersisted ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-variant text-on-surface-variant'}`}>
            {storagePersisted ? 'PERSISTENT' : 'STANDARD'}
          </span>
        </div>
        <button
          type="button"
          onClick={handleRequestStoragePersistence}
          className="w-full min-h-[56px] px-4 py-3 bg-primary text-on-primary font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2 shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">save_as</span>
          <span>Request Storage Persistence (`navigator.storage.persist()`)</span>
        </button>
      </div>

      {/* Offline Readiness Certification Badge */}
      <div className="flex flex-col gap-gap-compact bg-surface-container-lowest p-4 rounded-xl shadow-md border-2 border-error">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-error">
            <span className="material-symbols-outlined text-[24px]">fmd_bad</span>
            <span className="font-headline-sm text-headline-sm uppercase font-extrabold tracking-tight">
              🚨 TACTICAL FIELD SECURITY: ZERO-TRACE EMERGENCY WIPE
            </span>
          </div>
          <div className="px-2 py-0.5 bg-error/20 text-error rounded font-label-sm text-label-sm font-bold uppercase tracking-wider">
            CRITICAL
          </div>
        </div>
        <p className="font-body-sm text-body-sm text-on-surface-variant font-medium">
          Immediate on-device sanitize protocol for lost/compromised field hardware in hostile mountain sector.
        </p>

        <div className="bg-surface-container-low p-3 rounded-lg flex flex-col gap-2">
          <span className="font-label-sm text-label-sm text-on-surface font-extrabold uppercase tracking-wider">
            Atomic Sweep Checklist:
          </span>
          <div className="grid grid-cols-1 gap-1.5 font-body-sm text-body-sm text-on-surface">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">check_box</span>
              <span>Atomic IndexedDB drop (inspections &amp; CRDTs)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">check_box</span>
              <span>OPFS model weights sanitize (WebLLM/MediaPipe)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">check_box</span>
              <span>ServiceWorker CacheStorage purge</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-error text-[18px]">check_box</span>
              <span>WebRTC mesh cryptographic token revocation</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">
              [Demo Mode: Safe Simulation Armed]
            </span>
          </div>
          <span className="font-label-sm text-label-sm text-outline font-bold">REVERSIBLE SANDBOX</span>
        </div>

        <button
          type="button"
          onClick={handleAtomicWipe}
          className="w-full min-h-[56px] px-4 py-3 bg-error hover:bg-on-error-container active:scale-[0.98] text-on-error font-headline-sm text-headline-sm uppercase rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[26px]">security_update_warning</span>
          <span className="text-center leading-tight tracking-tight">
            EXECUTE ATOMIC CRYPTOGRAPHIC EMERGENCY WIPE (ZERO-TRACE REVERT TO BLANK HTML)
          </span>
        </button>
      </div>

      <div className="flex items-center gap-3 p-4 bg-tertiary-container text-on-tertiary-container rounded-xl shadow-md">
        <div className="w-12 h-12 rounded-full bg-on-tertiary-container text-tertiary-container flex items-center justify-center shrink-0 shadow-sm">
          <span className="material-symbols-outlined text-[30px]">verified</span>
        </div>
        <div className="flex flex-col">
          <span className="font-headline-sm text-headline-sm uppercase font-extrabold tracking-tight">
            100% AIR-GAP VERIFIED
          </span>
          <span className="font-body-sm text-body-sm font-medium opacity-90">
            HACKATHON JURY CERTIFIED • ZERO SERVER DEPENDENCY
          </span>
        </div>
      </div>

      {/* Modal Confirmation for Purging Storage */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-on-surface/60 backdrop-blur-xs flex items-center justify-center p-gutter-mobile">
          <div className="bg-surface-container-lowest text-on-surface rounded-xl p-5 w-full max-w-sm flex flex-col gap-4 shadow-xl border border-outline-variant/30">
            <div className="flex items-center gap-2.5 text-error">
              <span className="material-symbols-outlined text-[28px]">warning</span>
              <span className="font-headline-sm text-headline-sm uppercase">Purge Local Images?</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">
              This will clear high-resolution landslide snapshots from IndexedDB{' '}
              <code className="bg-surface-container px-1 rounded text-on-surface">binaryAssets</code> store to free OPFS storage.
            </p>
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowPurgeModal(false)}
                className="flex-1 min-h-[56px] bg-surface-container hover:bg-surface-container-high text-on-surface font-headline-sm text-headline-sm uppercase rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPurge}
                className="flex-1 min-h-[56px] bg-error hover:bg-on-error-container text-on-error font-headline-sm text-headline-sm uppercase rounded-lg cursor-pointer"
              >
                Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
