import React, { useState } from 'react';
import { 
  Radio, 
  X, 
  WifiOff, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Sparkles, 
  ShieldCheck,
  Send,
  Train
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AirplaneModeSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onInjectTestLandslide: () => void;
}

export const AirplaneModeSimulator: React.FC<AirplaneModeSimulatorProps> = ({
  isOpen,
  onClose,
  onInjectTestLandslide
}) => {
  const [airplaneActive, setAirplaneActive] = useState(true);
  const [step, setStep] = useState(1);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleSimulateStageDemo = () => {
    setStep(2);
    setLogMessages(['[Airplane Mode] Disconnecting WAN cellular interfaces...']);

    setTimeout(() => {
      setLogMessages(prev => [...prev, '[PWA Cache] Shell loading from local Cache Storage API (0ms latency).']);
    }, 600);

    setTimeout(() => {
      setLogMessages(prev => [...prev, '[MediaPipe Vision] Running EfficientDet-Lite0 TFLite inside Web Worker...']);
      onInjectTestLandslide();
    }, 1200);

    setTimeout(() => {
      setLogMessages(prev => [...prev, '[WebGPU Llama-3.2-1B] Injected Nepali prompt: Pahira (पहिरा) detected at Paglajhora.']);
    }, 1800);

    setTimeout(() => {
      setLogMessages(prev => [...prev, '[QWBP WebRTC] QR handshake bound. Syncing Yjs state vector across mesh...']);
      setStep(3);
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    }, 2500);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content border-purple-500/40">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-600 rounded-lg">
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Hook C: Stage Demo Airplane Mode Simulator</h3>
              <p className="text-xs text-slate-400">PahadSathi Zero-WAN Hackathon Presentation Tool</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="p-4 bg-purple-950/40 rounded-xl border border-purple-800/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WifiOff className="w-6 h-6 text-amber-400" />
              <div>
                <span className="font-bold text-sm text-white block">Absolute Airplane Mode Simulation</span>
                <span className="text-xs text-slate-300">No cell service, no satellite, 100% offline WebRTC mesh</span>
              </div>
            </div>
            <span className="badge badge-amber font-mono">WAN DETACHED</span>
          </div>

          {/* Action Step */}
          {step === 1 && (
            <div className="space-y-3 text-center py-4">
              <p className="text-xs text-slate-300">
                Click below to simulate the live presentation sequence on stage for the hackathon judges!
              </p>
              <button
                onClick={handleSimulateStageDemo}
                className="btn bg-gradient-to-r from-purple-600 to-sky-600 hover:from-purple-700 hover:to-sky-700 text-white font-bold py-3 px-6 text-sm shadow-xl shadow-purple-600/30"
              >
                <Zap className="w-5 h-5" />
                <span>Run Stage Presentation Sequence (Hook C)</span>
              </button>
            </div>
          )}

          {/* Execution Log */}
          {step >= 2 && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-purple-300 space-y-1.5 max-h-48 overflow-y-auto">
                {logMessages.map((msg, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-500">&gt;</span>
                    <span>{msg}</span>
                  </div>
                ))}
              </div>

              {step === 3 && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs space-y-1 text-emerald-300">
                  <span className="font-bold block flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Stage Simulation Complete!</span>
                  </span>
                  <p className="text-[11px] text-emerald-200">
                    Test Landslide report injected at Paglajhora, AI diagnostic rendered, and CRDT synced to mesh in &lt; 3s with 0 WAN bytes!
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
