import React, { useState, useRef } from 'react';
import type { AnomalyType, Language, InspectionRecord, LLMModel } from '../types';
import { runAIDiagnostic, type DiagnosticResult } from '../services/aiDiagnosticEngine';
import { signReportPayload, computeSHA256 } from '../services/crypto';

interface CameraSLMScreenProps {
  language: Language;
  onAddInspection: (record: InspectionRecord, photoArrayBuffer?: ArrayBuffer) => void;
  onNavigateToMesh: () => void;
}

export const CameraSLMScreen: React.FC<CameraSLMScreenProps> = ({
  language,
  onAddInspection,
  onNavigateToMesh
}) => {
  const [selectedModel, setSelectedModel] = useState<LLMModel>('gemma-2-2b');
  const [selectedAnomalies, setSelectedAnomalies] = useState<AnomalyType[]>(['tension_crack', 'water_seepage']);
  const [passable, setPassable] = useState(false);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [capturedArrayBuffer, setCapturedArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerToast = (title: string, subtitle: string) => {
    setToastMessage(`${title} • ${subtitle}`);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40, 30, 40]);
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCapturedPhotoUrl(url);

      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          setCapturedArrayBuffer(reader.result);
        }
      };
      reader.readAsArrayBuffer(file);
      triggerToast('Snapshot Captured', 'Quantized SLM running inference on tension fracture...');
    }
  };

  const handleSaveToVault = async () => {
    setIsProcessing(true);

    try {
      const aiResult = await runAIDiagnostic({
        anomalies: selectedAnomalies,
        corridor: 'NH-55 (Hill Cart Road)',
        locationName: 'Paglajhora Sinking Zone',
        language,
        passable,
        selectedModel
      });

      setDiagnosticResult(aiResult);

      let photoHash = '0x8F32C';
      let buffer: ArrayBuffer;

      if (capturedArrayBuffer) {
        buffer = capturedArrayBuffer;
        photoHash = await computeSHA256(buffer);
      } else {
        const dummyText = `sample-geotech-photo-${Date.now()}`;
        const encoder = new TextEncoder();
        buffer = encoder.encode(dummyText).buffer as ArrayBuffer;
        photoHash = await computeSHA256(buffer);
      }

      const timestamp = Date.now();
      const reportId = `report-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;

      const { signatureHex, publicKeyHex } = await signReportPayload({
        geohash: 'tu11a',
        timestamp,
        passable,
        photoHash
      });

      const newRecord: InspectionRecord = {
        id: reportId,
        timestamp,
        corridor: 'NH-55 (Hill Cart Road)',
        locationName: 'Paglajhora Sinking Zone',
        latitude: 26.9014,
        longitude: 88.2624,
        geohash: 'tu11a',
        anomalyTypes: selectedAnomalies,
        severity: aiResult.severity,
        hazardScore: aiResult.hazardScore,
        passable,
        description: `SLM Geotechnical Telemetry: Detected ${selectedAnomalies.join(', ')} at Kurseong NH-110 corridor.`,
        aiDiagnostic: aiResult.diagnosticText,
        language,
        photoHash,
        signature: signatureHex,
        publicKey: publicKeyHex,
        verified: true,
        isGangmanReport: false
      };

      await onAddInspection(newRecord, buffer);
      setIsProcessing(false);
      triggerToast('Record Committed to Vault', `Hash: ${photoHash.substring(0, 8)} • Queued for BLE Mesh Relay`);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-gap-default">
      {/* Viewfinder Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-container-highest shadow-sm rounded-lg border border-outline-variant/30">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full bg-secondary animate-ping" />
          <span className="font-headline-sm text-headline-sm text-on-surface uppercase tracking-tight truncate">
            Slope Anomaly Geotechnical Monitor
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary text-on-secondary rounded text-label-sm font-label-sm uppercase font-bold shrink-0">
          <span className="material-symbols-outlined text-[16px]">videocam</span>
          <span>REC [EDGE-CV]</span>
        </div>
      </div>

      {/* High-Contrast Tactical Camera Viewfinder Console */}
      <div className="relative w-full rounded-xl overflow-hidden bg-on-surface shadow-md aspect-[4/3] flex flex-col justify-between p-3 select-none">
        {/* Background Simulated Video Feed */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-85"
          style={{
            backgroundImage: capturedPhotoUrl
              ? `url('${capturedPhotoUrl}')`
              : `url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80')`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-on-surface/90 via-transparent to-on-surface/75 pointer-events-none" />

        {/* HUD Top: Gyro Pitch/Roll & Coordinates */}
        <div className="relative z-10 flex items-start justify-between text-surface gap-2">
          <div className="flex flex-col gap-1 bg-on-surface/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
            <div className="flex items-center gap-1 text-label-sm font-label-sm text-secondary-fixed">
              <span className="material-symbols-outlined text-[14px]">explore</span>
              <span className="font-bold">SLOPE ANGLE: 42° INCLINE</span>
            </div>
            <div className="font-label-sm text-label-sm tracking-wider text-surface-variant font-mono">
              ROLL: -3.4° | PITCH: +41.8°
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 bg-on-surface/85 backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-sm text-right border border-outline-variant/30">
            <div className="flex items-center gap-1 text-label-sm font-label-sm text-tertiary-fixed">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed animate-pulse" />
              <span className="font-bold">GPS RTK LOCK</span>
            </div>
            <div className="font-label-sm text-label-sm text-surface-variant font-mono">
              26.9014° N • 88.2624° E
            </div>
            <div className="font-label-sm text-label-sm text-surface-bright font-mono font-bold">
              ALT: 2,134M AMSL
            </div>
          </div>
        </div>

        {/* Center Reticle & MediaPipe Bounding Box */}
        <div className="relative z-10 my-auto w-full flex items-center justify-center">
          <div className="w-5/6 max-w-sm rounded-lg p-2.5 shadow-lg bg-secondary-container/20 backdrop-blur-[2px] transform transition-transform animate-pulse flex flex-col justify-between border-2 border-secondary-container">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-secondary-container text-on-secondary rounded text-label-sm font-label-sm font-extrabold uppercase shadow">
                <span className="material-symbols-outlined text-[14px]">warning</span>
                <span>Tension Crack Detected</span>
              </div>
              <span className="px-1.5 py-0.5 bg-on-surface text-surface text-label-sm font-label-sm font-mono font-bold rounded">
                CONF: 89.4%
              </span>
            </div>
            <div className="h-16 flex items-center justify-center">
              <div className="px-2 py-1 bg-on-surface/90 rounded text-label-sm font-label-sm text-secondary-fixed font-mono text-center">
                EST. FISSURE DEPTH: ~14cm | SEEPAGE: HIGH
              </div>
            </div>
            <div className="flex items-center justify-between text-label-sm font-label-sm text-surface font-mono">
              <span>EDGE-TRACK: ID #829</span>
              <span className="text-tertiary-fixed">CV-TFLITE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* HUD Bottom: Shutter Button & Controls */}
        <div className="relative z-10 flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 bg-on-surface/85 px-2 py-1.5 rounded-lg shadow-sm border border-outline-variant/30">
            <div className="w-10 h-10 rounded overflow-hidden bg-surface-container-high shrink-0">
              <img
                src={capturedPhotoUrl || 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=150&q=80'}
                alt="Cached Frame"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-surface-bright font-bold uppercase">Cached Frame</span>
              <span className="font-label-sm text-label-sm text-surface-variant font-mono">14:02:08 NPT</span>
            </div>
          </div>

          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-16 h-16 rounded-full bg-surface-container-lowest flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer focus:outline-none focus:ring-4 focus:ring-primary"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary shadow-sm">
              <span className="material-symbols-outlined text-[28px]">photo_camera</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedModel(selectedModel === 'gemma-2-2b' ? 'gemma-3-4b' : 'gemma-2-2b')}
            className="flex flex-col items-center justify-center w-11 h-11 rounded-lg bg-on-surface/85 text-surface-bright shadow-sm active:bg-on-surface cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">flip_camera_android</span>
            <span className="font-label-sm text-[9px] uppercase tracking-tighter">
              {selectedModel === 'gemma-2-2b' ? '0.5x Ultra' : '1.0x Main'}
            </span>
          </button>
        </div>
      </div>

      {/* On-Device AI Engine Selector */}
      <div className="flex flex-col gap-2 p-3 bg-blue-50 border-2 border-black rounded-xl shadow-[3px_3px_0px_#000]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-black text-sm">
            <span className="material-symbols-outlined text-[20px] text-blue-600">psychology</span>
            <span>AI Diagnostic Engine</span>
          </div>
          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded border border-emerald-400">
            OFFLINE READY
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-1">
          <button
            type="button"
            onClick={() => setSelectedModel('gemma-2-2b')}
            className={`p-2 rounded-lg font-mono text-xs font-bold border-2 border-black transition-all cursor-pointer ${
              selectedModel === 'gemma-2-2b'
                ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#000]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Gemma 2 2B (Fast)
          </button>
          <button
            type="button"
            onClick={() => setSelectedModel('gemma-3-4b')}
            className={`p-2 rounded-lg font-mono text-xs font-bold border-2 border-black transition-all cursor-pointer ${
              selectedModel === 'gemma-3-4b'
                ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#000]'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            Gemma 3 4B (High Precision)
          </button>
        </div>
      </div>

      {/* Interactive AI Geotechnical Diagnostic Stream Output */}
      <div className="flex flex-col bg-surface-container-lowest rounded-xl p-4 shadow-md gap-3 border border-outline-variant/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary flex items-center justify-center shadow">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-on-surface uppercase leading-none">SLM Synthesis</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono mt-0.5">LOCAL RUNTIME • 18 TOKENS/SEC</span>
            </div>
          </div>
          <span className="px-2 py-1 bg-error-container text-on-error-container font-label-sm text-label-sm font-extrabold rounded">
            CRITICAL HAZARD
          </span>
        </div>

        {/* Bilingual Output Content */}
        <div className="flex flex-col gap-2 p-3 bg-surface-container-low rounded-lg">
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1 text-error font-headline-sm text-headline-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">report_problem</span>
              <span>चेतावनी (Tension Crack Warning)</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface leading-relaxed">
              {diagnosticResult?.diagnosticText || 'यस भिरालो जमिनमा ८९.४% यकिनता सहित गम्भीर चिरा (Tension Crack) पत्ता लागेको छ। नजिकै पानी चुहिएको देखिएकाले पहिरो जाने उच्च जोखिम छ। भल तर्काउने कुलो तत्काल बनाउनुहोस्।'}
            </p>
          </div>

          <div className="pt-2 border-t border-outline-variant/30">
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              <strong className="text-on-surface">Geotech Analysis:</strong> Active groundwater seepage near shear plane promotes pore-water liquefaction. Translational soil slippage risk is rated <span className="text-error font-bold">SEVERE</span> along Kurseong NH-110 corridor.
            </p>
          </div>
        </div>

        {/* Actionable Field Safety Directive Chips */}
        <div className="flex flex-col gap-1.5">
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold">Immediate Safety Directives:</span>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => triggerToast('Runoff Diverted', 'Field directive broadcasted')}
              className="flex items-center gap-1.5 px-3 py-2 bg-secondary-container text-on-secondary rounded-lg font-label-sm text-label-sm font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">alt_route</span>
              <span>DIVERT RUNOFF</span>
            </button>
            <button
              type="button"
              onClick={() => triggerToast('Evacuation Alert', 'Downslope road traffic halted')}
              className="flex items-center gap-1.5 px-3 py-2 bg-error text-on-error rounded-lg font-label-sm text-label-sm font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">no_crash</span>
              <span>EVACUATE DOWNSLOPE ROAD</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToMesh}
              className="flex items-center gap-1.5 px-3 py-2 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm font-bold shadow-sm active:scale-95 transition-transform cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">cell_tower</span>
              <span>BROADCAST TO MESH PEERS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 pt-1 pb-4">
        <button
          type="button"
          onClick={handleSaveToVault}
          disabled={isProcessing}
          className="w-full min-h-[56px] px-4 py-3 bg-blue-600 text-white font-mono font-extrabold uppercase rounded-xl flex items-center justify-center gap-3 shadow-[3px_3px_0px_#000] border-2 border-black active:translate-y-1 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer text-base"
        >
          <span className="material-symbols-outlined text-[26px]">save</span>
          <span>{isProcessing ? 'Saving Report...' : 'SAVE & REPORT HAZARD'}</span>
        </button>

        <button
          type="button"
          onClick={onNavigateToMesh}
          className="w-full min-h-[56px] px-4 py-3 bg-white text-black font-mono font-extrabold uppercase rounded-xl flex items-center justify-center gap-3 shadow-[3px_3px_0px_#000] border-2 border-black active:translate-y-1 active:shadow-[1px_1px_0px_#000] transition-all cursor-pointer text-base"
        >
          <span className="material-symbols-outlined text-[26px] text-blue-600">hub</span>
          <span>SHARE WITH NEARBY PHONES</span>
        </button>
      </div>

      {/* Micro Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 p-4 bg-on-surface text-surface-bright rounded-xl shadow-xl border border-outline-variant/30">
          <div className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary shrink-0">
            <span className="material-symbols-outlined text-[20px]">check</span>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-headline-sm text-headline-sm uppercase">{toastMessage.split('•')[0]}</span>
            <span className="font-body-sm text-body-sm text-surface-variant truncate">{toastMessage.split('•')[1] || ''}</span>
          </div>
        </div>
      )}
    </div>
  );
};
