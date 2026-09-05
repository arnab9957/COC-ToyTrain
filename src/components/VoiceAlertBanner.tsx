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

    setTimeout(() => setIsPlaying(false), 8000);
  };

  const handleRecordVoiceAlert = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert('Microphone recording is not supported on this browser.');
      return;
    }

    setIsRecording(true);
    setToastMsg('🎙️ Recording 5-second voice warning...');

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
          setToastMsg('✅ Voice warning recorded and saved offline.');
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
    <section className="w-full bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 font-sans">
      {/* Top Title & Alert Pills */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow shrink-0">
            <span className="material-symbols-outlined text-[22px]">volume_up</span>
          </div>
          <div>
            <h2 className="text-base text-gray-900 font-extrabold tracking-tight">
              Voice Alerts (ध्वनि सूचना)
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              Audio announcements in Nepali, Bengali, Hindi & English
            </p>
          </div>
        </div>

        {/* Alert Number Tabs */}
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
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition-all cursor-pointer ${
                activeAlertIndex === idx
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Alert #{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Voice Alert Text Box */}
      <div className="p-3.5 bg-white border border-amber-200 rounded-xl flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
          <span className="font-bold text-red-600 uppercase flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">location_on</span>
            {currentAlert.location}
          </span>
          <span>
            {new Date(currentAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <p className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
          "{getLocalizedAlertText(currentAlert)}"
        </p>

        {isPlaying && (
          <div className="flex items-center gap-2 mt-1 py-1.5 px-3 bg-amber-100/80 rounded-lg">
            <span className="text-xs font-bold text-amber-900">🔊 Playing Voice Announcement...</span>
            <div className="flex items-end gap-1 h-3.5 ml-auto">
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_100ms] h-full" />
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_200ms] h-2/3" />
              <span className="w-1 bg-amber-600 rounded-full animate-[bounce_0.6s_infinite_300ms] h-full" />
            </div>
          </div>
        )}
      </div>

      {/* Big Touch Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handlePlayVoiceAlert}
          className={`h-11 px-4 flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
            isPlaying
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-amber-400 text-gray-900 hover:bg-amber-500 shadow-sm active:scale-98'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {isPlaying ? 'stop' : 'volume_up'}
          </span>
          <span>{isPlaying ? 'STOP VOICE' : 'PLAY VOICE ALERT 🔊'}</span>
        </button>

        <button
          type="button"
          onClick={handleRecordVoiceAlert}
          disabled={isRecording}
          className={`h-11 px-4 flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-extrabold border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 transition-all cursor-pointer ${
            isRecording ? 'bg-red-600 text-white animate-pulse border-red-600' : ''
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-red-600">mic</span>
          <span>{isRecording ? 'RECORDING 5S...' : 'RECORD WARNING 🎙️'}</span>
        </button>
      </div>

      {/* Recorded Preview */}
      {recordedAudioUrl && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 truncate">
            <span className="material-symbols-outlined text-[18px] text-emerald-700">graphic_eq</span>
            <span className="truncate">Your Recorded Voice Alert (Ready offline)</span>
          </div>
          <audio src={recordedAudioUrl} controls className="h-7 max-w-[150px]" />
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="p-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl shadow flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-400 text-[18px]">info</span>
          <span>{toastMsg}</span>
        </div>
      )}
    </section>
  );
};


