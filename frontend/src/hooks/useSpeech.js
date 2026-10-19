import { useCallback, useEffect, useRef, useState } from 'react';
import { resolveMediaUrl } from '../services/api.js';

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

function getAvailableVoices() {
  if (!speechSupported) return [];
  return window.speechSynthesis.getVoices() || [];
}

function pickVoice(lang, voicesList) {
  if (!speechSupported) return null;
  const voices = voicesList && voicesList.length > 0 ? voicesList : getAvailableVoices();
  const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase() || v.lang.replace('_', '-').toLowerCase() === lang.toLowerCase());
  if (exact) return exact;
  const prefix = lang.split('-')[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(prefix)) || null;
}

/** Text-to-speech + pre-recorded audio hook */
const LANG_CODE = { en: 'en-IN', hi: 'hi-IN', kn: 'kn-IN' };

export function useSpeech(lang = 'en') {
  const [speaking, setSpeaking] = useState(false);
  const [slow, setSlow] = useState(() => localStorage.getItem('dulingo_slow') === '1');
  const [mode, setMode] = useState(null); // 'file' | 'tts' | null
  const [voices, setVoices] = useState(() => getAvailableVoices());
  const timer = useRef(null);
  const audioRef = useRef(null);

  // Mobile Chrome & Safari load voices asynchronously
  useEffect(() => {
    if (!speechSupported) return;
    const updateVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) setVoices(v);
    };
    updateVoices();
    window.speechSynthesis.addEventListener('voiceschanged', updateVoices);
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', updateVoices);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('dulingo_slow', slow ? '1' : '0');
    if (audioRef.current) {
      audioRef.current.playbackRate = slow ? 0.75 : 1.0;
    }
  }, [slow]);

  const stop = useCallback(() => {
    clearTimeout(timer.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (speechSupported) {
      window.speechSynthesis.cancel();
    }
    setSpeaking(false);
    setMode(null);
  }, []);

  const fallbackTts = useCallback((text, { onBoundary, onEnd } = {}) => {
    if (!speechSupported || !text) return;
    
    // Clear any previous queued utterance
    window.speechSynthesis.cancel();

    // Workaround for Chrome Android bug where paused synthesis halts future utterances
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const u = new SpeechSynthesisUtterance(text);
    const code = LANG_CODE[lang] || 'en-IN';
    u.lang = code;

    const currentVoices = voices.length > 0 ? voices : getAvailableVoices();
    const v = pickVoice(code, currentVoices) || (lang === 'en' ? pickVoice('en-GB', currentVoices) || pickVoice('en-US', currentVoices) : null);
    if (v) u.voice = v;

    u.rate = slow ? 0.75 : 0.95;

    u.onstart = () => { setSpeaking(true); setMode('tts'); };
    u.onend = () => { setSpeaking(false); setMode(null); onEnd?.(); };
    u.onerror = () => { setSpeaking(false); setMode(null); };
    if (onBoundary) u.onboundary = (e) => onBoundary(e.charIndex);

    clearTimeout(timer.current);
    // 50ms tick delay to resolve mobile browser cancel/speak race conditions
    timer.current = setTimeout(() => {
      try {
        window.speechSynthesis.speak(u);
      } catch {
        setSpeaking(false);
      }
    }, 50);
  }, [slow, lang, voices]);

  // Plays pre-recorded audio file if audioUrl exists, otherwise falls back to browser Web Speech TTS
  const speak = useCallback((text, { audioUrl, onBoundary, onEnd } = {}) => {
    stop();

    const resolvedAudio = resolveMediaUrl(audioUrl);
    if (resolvedAudio) {
      try {
        const audio = new Audio();
        // Cross-origin and preloading attributes for mobile WebKit & Blink
        audio.preload = 'auto';
        audio.src = resolvedAudio;
        audioRef.current = audio;
        audio.playbackRate = slow ? 0.75 : 1.0;

        audio.onplay = () => {
          setSpeaking(true);
          setMode('file');
        };

        audio.onended = () => {
          setSpeaking(false);
          setMode(null);
          audioRef.current = null;
          onEnd?.();
        };

        audio.onerror = () => {
          // Fall back to TTS if audio file fails to load or decode
          audioRef.current = null;
          setMode(null);
          if (text && speechSupported) {
            fallbackTts(text, { onBoundary, onEnd });
          } else {
            setSpeaking(false);
          }
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // Autoplay policies may block unprompted audio; fallback to TTS
            if (text && speechSupported) fallbackTts(text, { onBoundary, onEnd });
            else setSpeaking(false);
          });
        }
        return;
      } catch {
        if (!text) { setSpeaking(false); return; }
      }
    }

    if (text) {
      fallbackTts(text, { onBoundary, onEnd });
    }
  }, [slow, lang, stop, fallbackTts]);

  useEffect(() => () => {
    clearTimeout(timer.current);
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (speechSupported) window.speechSynthesis.cancel();
  }, []);

  // true when the device has a voice for the chosen language
  const hasVoice = !speechSupported || lang === 'en' || !!pickVoice(LANG_CODE[lang] || 'en-IN', voices);

  return { speak, stop, speaking, slow, setSlow, supported: speechSupported, hasVoice, mode };
}

/* ---------- Web Speech Recognition (Speech-to-Text) ---------- */
export const recognitionSupported =
  typeof window !== 'undefined' &&
  ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

export function useSpeechRecognition(lang = 'en') {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);

  const startListening = useCallback((onResult) => {
    if (!recognitionSupported) {
      setError('Speech recognition is not supported in this browser. Please try Chrome or Edge.');
      return;
    }
    setError('');
    stopListening();

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const rec = new SpeechRecognition();
      recognitionRef.current = rec;
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = LANG_CODE[lang] || 'en-IN';

      rec.onstart = () => {
        setListening(true);
      };

      rec.onresult = (event) => {
        let text = '';
        for (let i = 0; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
        }
        setTranscript(text);
        if (onResult) {
          const isFinal = event.results[event.results.length - 1].isFinal;
          onResult(text, isFinal);
        }
      };

      rec.onerror = (e) => {
        if (e.error !== 'no-speech') {
          setError(
            e.error === 'not-allowed'
              ? 'Microphone permission was denied. Please allow microphone access.'
              : `Voice error: ${e.error}`
          );
        }
        setListening(false);
      };

      rec.onend = () => {
        setListening(false);
      };

      rec.start();
    } catch (err) {
      setError(err.message || 'Failed to start speech recognition');
      setListening(false);
    }
  }, [lang, stopListening]);

  const toggleListening = useCallback((onResult) => {
    if (listening) {
      stopListening();
    } else {
      startListening(onResult);
    }
  }, [listening, startListening, stopListening]);

  useEffect(() => () => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch {}
    }
  }, []);

  return {
    supported: recognitionSupported,
    listening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
