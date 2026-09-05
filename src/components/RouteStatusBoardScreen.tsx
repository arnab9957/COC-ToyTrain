import React, { useState, useEffect, useRef } from 'react';
import type { InspectionRecord, TransitCorridor, CorridorStatus, Language } from '../types';
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

    ctx.fillStyle = '#e2e2e2';
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
    <div className="flex flex-col w-full gap-gap-default">
      {/* 1. Permanent Voice Alert Banner */}
      <VoiceAlertBanner language={language} />

      {/* 2. Sub-Header Status Bar matching Stitch template */}
      <section className="flex flex-col gap-1 p-3 bg-surface-container rounded-xl shadow-sm">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-primary text-[20px] shrink-0">alt_route</span>
            <h1 className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface truncate">
              Route Corridor Board
            </h1>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 bg-surface-container-highest rounded shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-ping" />
            <span className="font-label-sm text-label-sm text-on-surface uppercase">Live P2P</span>
          </div>
        </div>
        <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
          <span className="truncate">Peer: <strong className="text-on-surface">GTA-942</strong> (3m ago)</span>
          <span className="shrink-0 text-tertiary font-bold flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">offline_bolt</span>
            Geo-Cache: ACTIVE
          </span>
        </div>
      </section>

      {/* 3. High Risk Emergency Alert Box matching Stitch template */}
      {!alertAcknowledged && (
        <section className="flex flex-col bg-secondary text-on-secondary rounded-xl p-4 shadow-md transition-all">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-surface-container-lowest text-secondary flex items-center justify-center shrink-0 shadow">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-label-sm text-label-sm uppercase px-1.5 py-0.5 bg-surface-container-lowest text-secondary rounded font-extrabold">
                  CRITICAL
                </span>
                <span className="font-label-sm text-label-sm text-on-secondary/80">NH-10 SECTOR</span>
              </div>
              <h2 className="font-headline-md text-headline-md text-on-secondary uppercase mt-0.5 leading-tight">
                Active Landslide: Sevoke Rd
              </h2>
            </div>
          </div>
          <p className="font-body-sm text-body-sm text-on-secondary/95 mt-2.5 leading-relaxed">
            Debris flow active near Teesta Bazaar. Local diversions via Monsong. Signed by <strong>Gorkha Territorial Administration Disaster Cell</strong>.
          </p>

          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={() => setAlertAcknowledged(true)}
              className="h-touch-target-min min-h-[48px] flex items-center justify-center gap-1.5 bg-surface-container-lowest text-on-surface rounded font-headline-sm text-headline-sm uppercase tracking-wide hover:bg-surface-container-low transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">done_all</span>
              <span>Acknowledge</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToMesh}
              className="h-touch-target-min min-h-[48px] flex items-center justify-center gap-1.5 bg-on-secondary text-secondary rounded font-headline-sm text-headline-sm uppercase tracking-wide hover:opacity-90 transition-transform active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Push P2P</span>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-surface-container-lowest/20 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-surface-container-lowest text-[18px]">download_done</span>
                <span className="font-label-sm text-label-sm uppercase font-extrabold text-surface-container-lowest tracking-tight">NATIVE OS CONTENT INDEXING: ACTIVE</span>
              </div>
              <span className="font-label-sm text-label-sm px-1.5 py-0.5 bg-surface-container-lowest text-secondary rounded font-bold uppercase shrink-0">Zero-UI Shelf</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-secondary/90 leading-snug">
              Registered to Chrome/Android System "Downloads" & Native Offline Discovery Shelf. Users discover this Sevoke Rd alert without opening the app!
            </p>
            <button
              type="button"
              onClick={() => triggerToast('Simulated Chrome Offline Shelf: Alert shown on Android Home!')}
              className="mt-1 h-touch-target-min min-h-[40px] w-full bg-surface-container-lowest text-secondary rounded font-label-sm text-label-sm uppercase font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              <span>Open Browser Offline Shelf Simulation</span>
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

      {/* 4. Interactive Vector Mountain Map Container matching Stitch template */}
      <section className="flex flex-col bg-surface-container-low rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 bg-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">terrain</span>
            <span className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface">Ridge Pass Vectors</span>
          </div>
          <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-lowest text-on-surface-variant rounded font-bold">
            1,420 GeoTiles Cached
          </span>
        </div>

        <div className="relative w-full h-56 bg-surface-container-highest overflow-hidden">
          <canvas ref={canvasRef} width={358} height={224} className="w-full h-full block cursor-grab active:cursor-grabbing" />
          
          <div className="absolute top-2 left-2 pointer-events-none bg-surface-container-lowest/90 backdrop-blur px-2 py-1 rounded shadow-sm">
            <p className="font-label-sm text-label-sm text-on-surface uppercase font-bold">Darjeeling - Siliguri Ridge Vector</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Elev: 2,042m • GPS Mode: Inertial Mesh</p>
          </div>

          <div className="absolute right-2 bottom-2 flex flex-col gap-1.5 z-10">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.15))}
              className="w-12 h-12 bg-surface-container-lowest text-on-surface rounded shadow-md flex items-center justify-center active:scale-95 transition-all text-[22px] font-bold cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.15))}
              className="w-12 h-12 bg-surface-container-lowest text-on-surface rounded shadow-md flex items-center justify-center active:scale-95 transition-all text-[22px] font-bold cursor-pointer"
            >
              -
            </button>
          </div>

          <div className="absolute left-2 bottom-2 bg-surface-container-lowest/90 backdrop-blur px-2 py-1 rounded text-on-surface font-label-sm text-label-sm flex items-center gap-2 font-bold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error" /> Blocked</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-container" /> Caution</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-tertiary" /> Open</span>
          </div>
        </div>
      </section>

      {/* 5. Route Status Corridor Matrix matching Stitch template */}
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-headline-sm text-headline-sm uppercase tracking-tight text-on-surface">Corridor Status Feed</h2>
          <span className="font-label-sm text-label-sm text-on-surface-variant font-bold">5 MONITORED ARTERIES</span>
        </div>

        {corridorStatuses.map((corridor) => {
          const isExpanded = expandedCorridor === corridor.corridor;

          return (
            <article key={corridor.corridor} className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden transition-all border border-outline-variant/20">
              <button
                type="button"
                onClick={() => setExpandedCorridor(isExpanded ? null : corridor.corridor)}
                className="w-full text-left p-3.5 flex flex-col gap-2 focus:outline-none cursor-pointer hover:bg-surface-container-low/50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-label-md text-label-md px-2 py-0.5 rounded font-bold uppercase shrink-0 ${
                    corridor.passable ? 'bg-tertiary text-on-tertiary' : 'bg-error text-on-error'
                  }`}>
                    {corridor.passable ? 'Open' : 'Blocked'}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1 font-bold">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {new Date(corridor.lastReportTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {corridor.activeHazardsCount} pings
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface font-bold">{corridor.corridor}</h3>
                    <p className="font-body-sm text-body-sm text-secondary font-bold mt-0.5">{corridor.summary}</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant transition-transform font-bold">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-3.5 pb-4 pt-1 flex flex-col gap-3 bg-surface-container-low border-t border-outline-variant/20">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-surface-container rounded text-on-surface font-label-sm text-label-sm border border-outline-variant/30 font-bold">
                    <span className="material-symbols-outlined text-primary text-[16px]">share_location</span>
                    <span className="truncate">Sync Vector: Propagated via Ridge Proxy Lending (Ghoom Peak Tunnel)</span>
                  </div>

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
                    <p className="font-headline-sm text-headline-sm text-on-surface leading-normal font-bold">
                      "पहिरोका कारण सडक पूर्ण रूपमा बन्द छ। गाडी घुम वा पङ्खाबारीबाट फर्काउनुहोला।"
                    </p>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-bold">
                      Road severed completely. Divert light traffic via Pankhabari.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerToast('Cached Incident Photo Loaded (480 KB ArrayBuffer)')}
                    className="h-touch-target-min min-h-[48px] w-full bg-surface-container-highest text-on-surface rounded font-headline-sm text-headline-sm uppercase flex items-center justify-center gap-2 hover:bg-surface-variant transition-colors cursor-pointer font-extrabold"
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
    </div>
  );
};



