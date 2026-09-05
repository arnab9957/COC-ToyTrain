import React, { useState } from 'react';
import type { Language } from '../types';
import {
  RECENT_VOICE_ALERTS,
  playEmergencyVoiceAlert,
  stopEmergencyVoiceAlert
} from '../services/voiceAlertService';

interface VoiceAlertBannerProps {
  language: Language;
}

export const VoiceAlertBanner: React.FC<VoiceAlertBannerProps> = ({ language }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeAlertIndex, setActiveAlertIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const currentAlert = RECENT_VOICE_ALERTS[activeAlertIndex] || RECENT_VOICE_ALERTS[0];

  const getLocalizedAlertText = (alert: typeof RECENT_VOICE_ALERTS[0]) => {
    switch (language) {
      case 'NE':
        return alert.nepaliText;
      case 'BN':
        return alert.bengaliText;
      case 'HI':
        return alert.hindiText;
      case 'EN':
      default:
        return alert.englishText;
    }
  };

  const handlePlayVoiceAlert = async () => {
    if (isPlaying) {
      stopEmergencyVoiceAlert();
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    const textToSpeak = getLocalizedAlertText(currentAlert);
    await playEmergencyVoiceAlert(textToSpeak, language);

    // Auto reset playing animation after 8s
    setTimeout(() => setIsPlaying(false), 8000);
  };

  const handleRecordVoiceAlert = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone recording not supported on this browser.');
      return;
    }

    setIsRecording(true);
    setToastMsg('🎙️ Recording 5s Voice Emergency Alert...');

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setRecordedAudioUrl(url);
          setIsRecording(false);
          setToastMsg('✅ Voice Note Recorded! Queued for Offline P2P Mesh Relay.');
          setTimeout(() => setToastMsg(null), 4000);
        };

        recorder.start();
        setTimeout(() => recorder.stop(), 5000);
      })
      .catch((err) => {
        console.error(err);
        setIsRecording(false);
        setToastMsg('❌ Microphone access denied.');
        setTimeout(() => setToastMsg(null), 3000);
      });
  };

  return (
    <section className="w-full bg-amber-50 border-2 border-black rounded-xl p-3.5 sm:p-4 shadow-[3px_3px_0px_#000] flex flex-col gap-3 font-mono">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-amber-500 border-2 border-black flex items-center justify-center text-black font-extrabold shadow-[1.5px_1.5px_0px_#000] shrink-0">
            <span className="material-symbols-outlined text-[22px]">volume_up</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-headline-sm text-sm sm:text-base text-black font-extrabold uppercase tracking-tight">
                Recent Voice Alerts
              </span>
              <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] rounded font-bold uppercase animate-pulse border border-black">
                LIVE VOICE
              </span>
            </div>
            <span className="text-[11px] text-gray-700 font-bold">
              ध्वनि चेतावनी • Trilingual Offline Audio Beacon
            </span>
          </div>
        </div>

        {/* Next / Previous Alert Selector */}
        <div className="flex items-center gap-1">
          {RECENT_VOICE_ALERTS.map((alert, idx) => (
            <button
              key={alert.id}
              type="button"
              onClick={() => {
                setActiveAlertIndex(idx);
                stopEmergencyVoiceAlert();
                setIsPlaying(false);
              }}
              className={`px-2 py-1 text-xs rounded border-2 border-black font-bold transition-all cursor-pointer ${
                activeAlertIndex === idx
                  ? 'bg-amber-400 text-black shadow-[1.5px_1.5px_0px_#000]'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Alert #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Alert Content Card */}
      <div className="p-3 bg-white border-2 border-black rounded-lg flex flex-col gap-2 shadow-[2px_2px_0px_#000]">
        <div className="flex items-center justify-between text-xs text-gray-700">
          <span className="font-extrabold text-black uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px] text-red-600">location_on</span>
            {currentAlert.location}
          </span>
          <span className="font-bold text-gray-500">
            {new Date(currentAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <p className="text-xs sm:text-sm font-bold text-black leading-relaxed">
          "{getLocalizedAlertText(currentAlert)}"
        </p>

        {/* Audio Spectrum Wave Animation when playing */}
        {isPlaying && (
          <div className="flex items-center gap-1 py-1.5 px-2 bg-amber-100 border border-amber-400 rounded">
            <span className="text-[11px] font-bold text-amber-900">Broadcasting Audio Beacon:</span>
            <div className="flex items-end gap-1 h-4 ml-auto">
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_200ms] h-2/3" />
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_300ms] h-full" />
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_400ms] h-1/2" />
            </div>
          </div>
        )}
      </div>

      {/* Action Controls: Play Audio & Record Voice Note */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handlePlayVoiceAlert}
          className={`h-12 px-3 flex items-center justify-center gap-2 rounded-lg font-mono text-xs uppercase font-extrabold border-2 border-black transition-all cursor-pointer ${
            isPlaying
              ? 'bg-red-600 text-white shadow-[2px_2px_0px_#000]'
              : 'bg-amber-400 text-black shadow-[2.5px_2.5px_0px_#000] hover:bg-amber-500'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isPlaying ? 'stop' : 'volume_up'}
          </span>
          <span>{isPlaying ? 'STOP VOICE ALERT' : 'PLAY VOICE ALERT (🔊)'}</span>
        </button>

        <button
          type="button"
          onClick={handleRecordVoiceAlert}
          disabled={isRecording}
          className={`h-12 px-3 flex items-center justify-center gap-2 rounded-lg font-mono text-xs uppercase font-extrabold border-2 border-black transition-all cursor-pointer ${
            isRecording
              ? 'bg-red-600 text-white animate-pulse'
              : 'bg-white text-black shadow-[2.5px_2.5px_0px_#000] hover:bg-gray-100'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-red-600">mic</span>
          <span>{isRecording ? 'RECORDING 5S...' : 'RECORD VOICE WARNING'}</span>
        </button>
      </div>

      {/* Recorded Voice Clip Preview */}
      {recordedAudioUrl && (
        <div className="p-2.5 bg-emerald-50 border-2 border-black rounded-lg flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 truncate">
            <span className="material-symbols-outlined text-[18px] text-emerald-700">graphic_eq</span>
            <span className="truncate">Your Voice Alert Note Recorded (Ready for Mesh)</span>
          </div>
          <audio src={recordedAudioUrl} controls className="h-8 max-w-[160px]" />
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="p-2.5 bg-black text-white text-xs font-bold rounded-lg shadow-md border border-white flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-[18px]">info</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </section>
  );
};
