import type { Language } from '../types';

export interface VoiceAlertItem {
  id: string;
  timestamp: number;
  location: string;
  corridor: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  nepaliText: string;
  bengaliText: string;
  hindiText: string;
  englishText: string;
}

export const RECENT_VOICE_ALERTS: VoiceAlertItem[] = [
  {
    id: 'voice-alert-sevoke-01',
    timestamp: Date.now() - 3 * 60 * 1000, // 3 mins ago
    location: 'Sevoke Road (Teesta Bazaar)',
    corridor: 'Teesta Valley (NH-10)',
    severity: 'CRITICAL',
    nepaliText: '⚠️ अति गम्भीर चेतावनी: सेभोक रोड टिस्टा बजार नजिकै पहिरो गएको छ। बाटो पूर्ण रूपमा बन्द छ। मन्सोङ वा रोहिणी मार्ग प्रयोग गर्नुहोला।',
    bengaliText: '⚠️ জরুরি ধস সতর্কতা: সেভোক রোড তিস্তা বাজারের কাছে ধস নেমেছে। রাস্তা সম্পূর্ণ বন্ধ। মনসং বা রোহিণী পথ ব্যবহার করুন।',
    hindiText: '⚠️ गंभीर भूस्खलन चेतावनी: सेवक रोड तीस्ता बाजार के पास भूस्खलन हुआ है। मार्ग पूरी तरह बंद है। मनसोंग या रोहिणी मार्ग का उपयोग करें।',
    englishText: '⚠️ CRITICAL ALERT: Active landslide at Sevoke Road near Teesta Bazaar. Highway is completely blocked. Divert via Monsong or Rohini.'
  },
  {
    id: 'voice-alert-paglajhora-02',
    timestamp: Date.now() - 22 * 60 * 1000, // 22 mins ago
    location: 'Paglajhora Sinking Zone',
    corridor: 'NH-55 (Hill Cart Road)',
    severity: 'WARNING',
    nepaliText: '⚠️ चेतावनी: पग्लाझोरा क्षेत्रमा धार र चिरा देखिएको छ। गाडीको गति १० किमी प्रति घण्टाभन्दा कम राख्नुहोस्।',
    bengaliText: '⚠️ সতর্কতা: পাগলাঝোরা অঞ্চলে ফাটল দেখা গেছে। গাড়ির গতি ১০ কিমি/ঘণ্টার নিচে রাখুন।',
    hindiText: '⚠️ चेतावनी: पगलाझोरा क्षेत्र में दरार देखी गई है। वाहन की गति 10 किमी/घंटा से कम रखें।',
    englishText: '⚠️ WARNING: Tension cracks reported at Paglajhora Sinking Zone. Maintain speed limit under 10 km/h.'
  }
];

/**
 * Plays a tactical 2-tone Web Audio API emergency alert beacon tone followed by speech synthesis
 */
export async function playEmergencyVoiceAlert(alertText: string, lang: Language): Promise<void> {
  try {
    // 1. Play Tactical Offline Web Audio Siren Tone
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      const audioCtx = new AudioContextClass();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.25);
      osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.5);

      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.5);
    }
  } catch (e) {
    console.log('Web Audio Siren Tone bypass:', e);
  }

  // 2. Play Speech Synthesis Utterance
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(alertText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    switch (lang) {
      case 'NE':
        utterance.lang = 'ne-NP';
        break;
      case 'BN':
        utterance.lang = 'bn-IN';
        break;
      case 'HI':
        utterance.lang = 'hi-IN';
        break;
      case 'EN':
      default:
        utterance.lang = 'en-US';
        break;
    }

    window.speechSynthesis.speak(utterance);
  }
}

/**
 * Stops any ongoing audio playback
 */
export function stopEmergencyVoiceAlert(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
