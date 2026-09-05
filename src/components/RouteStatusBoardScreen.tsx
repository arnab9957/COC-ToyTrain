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

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 35 * zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 35 * zoomLevel) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    ctx.lineWidth = 4;

    // NH-55 (Hill Cart Road) - Red Blocked
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(20, 180);
    ctx.quadraticCurveTo(120, 100, 200, 40);
    ctx.stroke();

    // Rohini Road - Orange Caution
    ctx.strokeStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(80, 200);
    ctx.quadraticCurveTo(180, 140, 280, 90);
    ctx.stroke();

    // Teesta Valley NH-10 - Green Open
    ctx.strokeStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(150, 210);
    ctx.quadraticCurveTo(240, 110, 320, 20);
    ctx.stroke();

    // Hotspot pin
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(140, 90, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px font-sans';
    ctx.fillText('Paglajhora (BLOCKED ⛔)', 154, 94);
  }, [zoomLevel]);

  const speakSummary = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
      triggerToast('🔊 Playing Voice Summary');
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

    let summary = 'Road clear and open for vehicles.';
    if (!isPassable) {
      summary = `⚠️ ROAD BLOCKED at ${spots.join(', ') || 'Sinking Zone'}. Divert via Pankhabari.`;
    } else if (corridorReports.length > 0) {
      summary = `Caution: ${corridorReports.length} hazard report(s) logged. Drive safely.`;
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
    <div className="flex flex-col w-full gap-4 font-sans">
      {/* 1. Permanent Voice Alert Banner */}
      <VoiceAlertBanner language={language} />

      {/* 2. Emergency Alert Notice */}
      {!alertAcknowledged && (
        <section className="flex flex-col bg-red-600 text-white rounded-2xl p-4 shadow-sm border border-red-700 gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 text-white flex items-center justify-center shrink-0 font-bold">
              <span className="material-symbols-outlined text-[26px]">warning</span>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-200">
                CRITICAL EMERGENCY
              </span>
              <h2 className="text-base sm:text-lg font-extrabold uppercase leading-snug mt-0.5">
                Landslide: Sevoke Road (NH-10)
              </h2>
              <p className="text-xs sm:text-sm text-white/90 mt-1 font-medium leading-relaxed">
                Active mudslide near Teesta Bazaar. Light traffic divert via Monsong.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setAlertAcknowledged(true)}
              className="h-10 flex items-center justify-center gap-1.5 bg-white text-red-700 rounded-xl text-xs uppercase font-extrabold hover:bg-gray-100 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">done</span>
              <span>Dismiss</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToMesh}
              className="h-10 flex items-center justify-center gap-1.5 bg-gray-900 text-white rounded-xl text-xs uppercase font-extrabold hover:bg-black cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">share</span>
              <span>Share Offline</span>
            </button>
          </div>
        </section>
      )}

      {toastMsg && (
        <div className="p-3 bg-gray-900 text-white rounded-xl shadow text-xs font-bold flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400">info</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 3. Mountain Ridge Map */}
      <section className="flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        <div className="p-3.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-[20px]">terrain</span>
            <h3 className="font-extrabold text-gray-900 text-sm">Pass Ridge Map</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold">
            🟢 Offline Cached
          </span>
        </div>

        <div className="relative w-full h-48 bg-slate-50 overflow-hidden">
          <canvas ref={canvasRef} width={358} height={192} className="w-full h-full block" />

          <div className="absolute right-2 bottom-2 flex flex-col gap-1 z-10">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.2))}
              className="w-9 h-9 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm flex items-center justify-center active:scale-95 text-lg font-bold cursor-pointer"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
              className="w-9 h-9 bg-white text-gray-900 border border-gray-300 rounded-lg shadow-sm flex items-center justify-center active:scale-95 text-lg font-bold cursor-pointer"
            >
              -
            </button>
          </div>

          <div className="absolute left-2 bottom-2 bg-white/90 backdrop-blur border border-gray-200 px-2.5 py-1 rounded-lg text-gray-900 text-xs font-bold flex items-center gap-3">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Blocked</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Caution</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Open</span>
          </div>
        </div>
      </section>

      {/* 4. Mountain Road Cards */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-base font-extrabold text-gray-900">
            Mountain Corridors
          </h3>
          <span className="text-xs text-gray-500 font-medium">5 Main Arteries</span>
        </div>

        {corridorStatuses.map((corridor) => {
          const isExpanded = expandedCorridor === corridor.corridor;

          return (
            <article key={corridor.corridor} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpandedCorridor(isExpanded ? null : corridor.corridor)}
                className="w-full text-left p-4 flex flex-col gap-2 focus:outline-none cursor-pointer hover:bg-gray-50/60"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-extrabold shrink-0 ${
                    corridor.passable ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {corridor.passable ? 'ROAD OPEN ✅' : 'ROAD BLOCKED ⛔'}
                  </span>
                  <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                    {new Date(corridor.lastReportTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h4 className="text-base font-extrabold text-gray-900">{corridor.corridor}</h4>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">{corridor.summary}</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-600 text-[24px] shrink-0">
                    {isExpanded ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 pt-1 flex flex-col gap-2.5 bg-gray-50/50 border-t border-gray-100">
                  <div className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col gap-1.5 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-700 font-bold uppercase flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px] text-amber-500">record_voice_over</span>
                        Nepali Summary
                      </span>
                      <button
                        type="button"
                        onClick={() => speakSummary('पहिरोका कारण सडक पूर्ण रूपमा बन्द छ। गाडी घुम वा पङ्खाबारीबाट फर्काउनुहोला।')}
                        className="px-2.5 py-1 bg-amber-400 text-gray-900 rounded-lg flex items-center gap-1 text-xs font-bold hover:bg-amber-500 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">volume_up</span>
                        <span>Listen 🔊</span>
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900">
                      "पहिरोका कारण सडक पूर्ण रूपमा बन्द छ। गाडी घुम वा पङ्खाबारीबाट फर्काउनुहोला।"
                    </p>
                    <span className="text-xs text-gray-500">
                      Road blocked by landslide. Divert via Pankhabari or Ghoom.
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerToast('Viewing Incident Photo...')}
                    className="h-10 w-full bg-white text-gray-900 border border-gray-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50 cursor-pointer shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px] text-blue-600">image</span>
                    <span>View Road Incident Photo</span>
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


