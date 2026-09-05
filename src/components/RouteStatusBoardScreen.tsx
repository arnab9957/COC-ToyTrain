import React, { useState, useEffect, useRef } from 'react';
import type { InspectionRecord, TransitCorridor, CorridorStatus, Language } from '../types';
import { performDBSCANClustering } from '../analytics/dbscan';
import { VoiceAlertBanner } from './VoiceAlertBanner';

interface RouteStatusBoardScreenProps {
  inspections: InspectionRecord[];
  language: Language;
  onNavigateToMesh: () => void;
}

const CORRIDORS: TransitCorridor[] = [
  'NH-55 (Hill Cart Road)',
  'Rohini Road',
  'Pankhabari Road',
  'Teesta Valley (NH-10)',
  'Dudhia Balasun Bridge'
];

export const RouteStatusBoardScreen: React.FC<RouteStatusBoardScreenProps> = ({
  inspections,
  language,
  onNavigateToMesh
}) => {
  const [expandedCorridor, setExpandedCorridor] = useState<string | null>('NH-55 (Hill Cart Road)');
  const [alertAcknowledged, setAlertAcknowledged] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#c3c6d7';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30 * zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 30 * zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.lineWidth = 4;

    // NH-55 (Hill Cart Road) - Red Blocked
    ctx.strokeStyle = '#ba1a1a';
    ctx.beginPath();
    ctx.moveTo(20, 180);
    ctx.quadraticCurveTo(120, 100, 200, 40);
    ctx.stroke();

    // Rohini Road - Orange Caution
    ctx.strokeStyle = '#fd651e';
    ctx.beginPath();
    ctx.moveTo(80, 200);
    ctx.quadraticCurveTo(180, 140, 280, 90);
    ctx.stroke();

    // Teesta Valley NH-10 - Green Open
    ctx.strokeStyle = '#007f36';
    ctx.beginPath();
    ctx.moveTo(150, 210);
    ctx.quadraticCurveTo(240, 110, 320, 20);
    ctx.stroke();

    // Hotspot pin
    ctx.fillStyle = '#ba1a1a';
    ctx.beginPath();
    ctx.arc(140, 90, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#1b1b1b';
    ctx.font = 'bold 11px "Space Grotesk"';
    ctx.fillText('Paglajhora (BLOCKED)', 152, 92);
  }, [zoomLevel]);

  const speakSummary = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      triggerToast('Playing Audio Summary');
    } else {
      alert(text);
    }
  };

  const clusters = performDBSCANClustering(inspections, 30, 2);

  const corridorStatuses: CorridorStatus[] = CORRIDORS.map((corridor) => {
    const corridorReports = inspections.filter((r) => r.corridor === corridor);
    const blockedCount = corridorReports.filter((r) => !r.passable).length;
    const isPassable = blockedCount === 0;

    const spots = Array.from(new Set(corridorReports.map((r) => r.locationName)));
    const latestTime =
      corridorReports.length > 0
        ? Math.max(...corridorReports.map((r) => r.timestamp))
        : Date.now();

    let summary = 'Road clear and operational.';
    if (!isPassable) {
      summary = `⚠️ BLOCKED at ${spots.join(', ') || 'Sinking Zone'}. Divert light traffic via Pankhabari.`;
    } else if (corridorReports.length > 0) {
      summary = `Caution: ${corridorReports.length} hazard report(s) logged along steep Dhar ridges.`;
    }

    return {
      corridor,
      passable: isPassable,
      activeHazardsCount: corridorReports.length,
      lastReportTimestamp: latestTime,
      summary,
      criticalSpots: spots
    };
  });

  return (
    <div className="flex flex-col w-full gap-4 font-mono">
      {/* 1. Recent Trilingual Voice Alert Component */}
      <VoiceAlertBanner language={language} />

      {/* 2. Sub-Header Status Bar */}
      <section className="flex flex-col gap-1.5 p-3.5 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_#000]">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-blue-600 text-[22px] shrink-0">map</span>
            <h1 className="text-base font-extrabold uppercase text-black truncate">
              Route Corridor Board
            </h1>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-400 rounded text-xs font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>LIVE P2P MESH</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs text-gray-700 pt-1.5 border-t border-gray-200">
          <span className="truncate">Active Peer: <strong className="text-black font-bold">GTA-942</strong> (3m ago)</span>
          <span className="shrink-0 text-emerald-700 font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">offline_bolt</span>
            Geo-Cache: ACTIVE
          </span>
        </div>
      </section>

      {/* 3. High Risk Emergency Alert Box */}
      {!alertAcknowledged && (
        <section className="flex flex-col bg-red-600 text-white rounded-xl p-4 shadow-[3px_3px_0px_#000] border-2 border-black">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-white text-red-600 flex items-center justify-center shrink-0 shadow font-extrabold border-2 border-black">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase px-2 py-0.5 bg-white text-red-700 rounded font-extrabold border border-black">
                  CRITICAL ALERT
                </span>
                <span className="text-xs font-mono font-bold text-white/90">NH-10 SECTOR</span>
              </div>
              <h2 className="font-headline-md text-lg text-white uppercase mt-1 leading-tight font-extrabold">
                Active Landslide (पहिरा): Sevoke Rd
              </h2>
            </div>
          </div>
          <p className="text-sm font-mono text-white/95 mt-2.5 leading-relaxed font-semibold">
            Debris flow active near Teesta Bazaar. Local diversions via Monsong. Verified by <strong>GTA Disaster Control Room</strong>.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setAlertAcknowledged(true)}
              className="h-12 flex items-center justify-center gap-1.5 bg-white text-black border-2 border-black rounded-lg font-mono text-xs uppercase font-extrabold hover:bg-gray-100 transition-transform active:scale-95 cursor-pointer shadow-[2px_2px_0px_#000]"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>Acknowledge</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToMesh}
              className="h-12 flex items-center justify-center gap-1.5 bg-black text-white border-2 border-black rounded-lg font-mono text-xs uppercase font-extrabold hover:bg-gray-800 transition-transform active:scale-95 cursor-pointer shadow-[2px_2px_0px_#fff]"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Share Offline</span>
            </button>
          </div>
        </section>
      )}

      {toastMsg && (
        <div className="p-3 bg-on-surface text-surface-bright rounded-xl shadow-xl font-label-sm text-label-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary-fixed">info</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Vector Ridge Pass Map Container */}
      <section className="flex flex-col bg-white rounded-xl overflow-hidden border-2 border-black shadow-[3px_3px_0px_#000]">
        <div className="p-3 bg-gray-100 border-b-2 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">terrain</span>
            <span className="font-extrabold uppercase tracking-tight text-black text-sm">Mountain Pass Ridge Map</span>
          </div>
          <span className="text-xs px-2 py-0.5 bg-white border border-black text-black rounded font-bold">
            1,420 GeoTiles Cached
          </span>
        </div>

        <div className="relative w-full h-56 bg-gray-200 overflow-hidden">
          <canvas ref={canvasRef} width={358} height={224} className="w-full h-full block cursor-grab" />
          
          <div className="absolute top-2 left-2 pointer-events-none bg-white/95 backdrop-blur px-2.5 py-1 rounded-lg border-2 border-black shadow-[1.5px_1.5px_0px_#000]">
            <p className="text-xs text-black uppercase font-extrabold">Darjeeling - Siliguri Ridge Vector</p>
            <p className="text-[11px] text-gray-700 font-bold">Elev: 2,042m • GPS Mode: Inertial Mesh</p>
          </div>

          <div className="absolute right-2 bottom-2 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
              className="w-10 h-10 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] flex items-center justify-center active:scale-95 transition-all text-[20px] font-extrabold cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="w-10 h-10 bg-white text-black border-2 border-black rounded-lg shadow-[2px_2px_0px_#000] flex items-center justify-center active:scale-95 transition-all text-[20px] font-extrabold cursor-pointer"
            >
              -
            </button>
          </div>

          <div className="absolute left-2 bottom-2 bg-white/95 border border-black px-2 py-1 rounded text-black text-xs font-bold flex items-center gap-2">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-black" /> Blocked</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-black" /> Caution</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 border border-black" /> Open</span>
          </div>
        </div>
      </section>

      {/* Corridor Status Feed */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-base font-extrabold uppercase text-black">Monitored Mountain Corridors</h2>
          <span className="text-xs text-gray-700 font-bold">5 ARTERIES</span>
        </div>

        {corridorStatuses.map((corridor) => {
          const isExpanded = expandedCorridor === corridor.corridor;

          return (
            <article key={corridor.corridor} className="bg-white rounded-xl shadow-[3px_3px_0px_#000] overflow-hidden border-2 border-black">
              <button
                type="button"
                onClick={() => setExpandedCorridor(isExpanded ? null : corridor.corridor)}
                className="w-full text-left p-3.5 flex flex-col gap-2 focus:outline-none cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded font-extrabold border border-black uppercase shrink-0 ${
                    corridor.passable ? 'bg-emerald-100 text-emerald-900 border-emerald-500' : 'bg-red-600 text-white'
                  }`}>
                    {corridor.passable ? 'OPEN ✅' : 'BLOCKED ⛔'}
                  </span>
                  <span className="text-xs text-gray-700 font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {new Date(corridor.lastReportTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {corridor.activeHazardsCount} pings
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-extrabold text-black">{corridor.corridor}</h3>
                    <p className="text-xs text-amber-900 font-bold mt-0.5">{corridor.summary}</p>
                  </div>
                  <span className="material-symbols-outlined text-black font-extrabold">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-4 pt-1 flex flex-col gap-3 bg-surface-container-low border-t border-outline-variant/20">
                  <div className="p-3 bg-surface-container rounded-lg flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-label-sm text-label-sm text-primary font-extrabold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">smart_toy</span> Offline LLM Summary (Nepali)
                      </span>
                      <button
                        type="button"
                        onClick={() => speakSummary('पहिरोका कारण सडक पूर्ण रूपमा बन्द छ। गाडी घुम वा पङ्खाबारीबाट फर्काउनुहोला।')}
                        className="p-1 text-primary hover:bg-surface rounded flex items-center gap-1 text-xs font-bold cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">volume_up</span>
                      </button>
                    </div>
                    <p className="font-headline-sm text-headline-sm text-on-surface leading-normal">
                      "पहिरोका कारण सडक पूर्ण रूपमा बन्द छ। गाडी घुम वा पङ्खाबारीबाट फर्काउनुहोला।"
                    </p>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Road severed completely. Divert light traffic via Pankhabari.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerToast('Cached Incident Photo Loaded (480 KB ArrayBuffer)')}
                    className="h-touch-target-min w-full bg-surface-container-highest text-on-surface rounded font-headline-sm text-headline-sm uppercase flex items-center justify-center gap-2 hover:bg-surface-variant cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">image</span>
                    <span>View Cached Incident Photo (480 KB)</span>
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </section>

      {/* DBSCAN Spatial Clusters */}
      <section className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-xl shadow-sm border border-outline-variant/30">
        <h3 className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface flex items-center gap-1.5">
          <span className="material-symbols-outlined text-primary text-[20px]">compass_calibration</span>
          <span>Haversine DBSCAN Spatial Clusters (&epsilon; = 30m)</span>
        </h3>

        <div className="flex flex-col gap-2">
          {clusters.map((c) => (
            <div key={c.clusterId} className="p-2.5 bg-surface-container-lowest rounded-lg font-label-sm text-label-sm text-on-surface space-y-1">
              <div className="flex items-center justify-between font-bold">
                <span>📍 {c.locationName}</span>
                <span className="px-1.5 py-0.5 bg-surface-container text-on-surface rounded text-[10px]">
                  {c.reports.length} Reports
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {c.deduplicatedReport.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
