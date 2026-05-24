import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { audioManager, voiceReader } from '@/lib/audio';

interface AudioContextType {
  isInitialized: boolean;
  volume: number;
  soundEnabled: boolean;
  voiceEnabled: boolean;
  voiceSpeed: number;
  isSpeaking: boolean;
  ambianceEnabled: boolean;
  ambianceVolume: number;
  initAudio: () => Promise<void>;
  setVolume: (volume: number) => void;
  toggleSound: () => void;
  toggleVoice: () => void;
  setVoiceSpeed: (speed: number) => void;
  toggleAmbiance: () => void;
  setAmbianceVolume: (volume: number) => void;
  playBgMusic: () => void;
  pauseBgMusic: () => void;
  playSfx: (name: 'lock' | 'correct' | 'wrong' | 'levelup' | 'tick') => void;
  speakQuestion: (question: any, questionNumber: number, onComplete?: () => void) => void;
  cancelSpeech: () => void;
  readAgain: (question: any, questionNumber: number) => void;
}

const AudioContext = createContext<AudioContextType | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(() => audioManager.isInitialized());
  const initPromiseRef = useRef<Promise<void> | null>(null);
  const [volume, setVolumeState] = useState(50);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceSpeed, setVoiceSpeedState] = useState(1.0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ambianceEnabled, setAmbianceEnabled] = useState(false);
  const [ambianceVolume, setAmbianceVolumeState] = useState(30);

  // Load initial settings
  useEffect(() => {
    const settings = audioManager.getSettings();
    setVolumeState(settings.volume);
    setSoundEnabled(settings.soundEnabled);
    setVoiceEnabled(settings.voiceEnabled);
    setVoiceSpeedState(settings.voiceSpeed);
    setAmbianceEnabled(settings.ambianceEnabled);
    setAmbianceVolumeState(settings.ambianceVolume);
    setIsInitialized(audioManager.isInitialized());
  }, []);

  // Check for reduced motion preference
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setVoiceEnabled(false);
      audioManager.setVoiceEnabled(false);
    }
  }, []);

  const initAudio = useCallback(async () => {
    if (audioManager.isInitialized()) {
      setIsInitialized(true);
      return;
    }
    if (initPromiseRef.current) {
      await initPromiseRef.current;
      return;
    }
    initPromiseRef.current = (async () => {
      try {
        await audioManager.init();
        setIsInitialized(true);
      } catch (e) {
        console.warn('Audio init error:', e);
        setIsInitialized(true);
      } finally {
        initPromiseRef.current = null;
      }
    })();
    await initPromiseRef.current;
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(newVolume);
    audioManager.setVolume(newVolume);
  }, []);

  const toggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    audioManager.setSoundEnabled(newEnabled);
  }, [soundEnabled]);

  const toggleVoice = useCallback(() => {
    const newEnabled = !voiceEnabled;
    setVoiceEnabled(newEnabled);
    audioManager.setVoiceEnabled(newEnabled);
    if (!newEnabled) {
      voiceReader.cancel();
      setIsSpeaking(false);
    }
  }, [voiceEnabled]);

  const setVoiceSpeed = useCallback((speed: number) => {
    setVoiceSpeedState(speed);
    audioManager.setVoiceSpeed(speed);
  }, []);

  const playBgMusic = useCallback(() => {
    if (isInitialized) {
      audioManager.playBg();
      if (ambianceEnabled) {
        audioManager.playAmbiance();
      }
    }
  }, [isInitialized, ambianceEnabled]);

  const pauseBgMusic = useCallback(() => {
    audioManager.pauseBg();
    audioManager.pauseAmbiance();
  }, []);

  const toggleAmbiance = useCallback(() => {
    const newEnabled = !ambianceEnabled;
    setAmbianceEnabled(newEnabled);
    audioManager.setAmbianceEnabled(newEnabled);
  }, [ambianceEnabled]);

  const setAmbianceVolume = useCallback((vol: number) => {
    setAmbianceVolumeState(vol);
    audioManager.setAmbianceVolume(vol);
  }, []);

  const playSfx = useCallback((name: 'lock' | 'correct' | 'wrong' | 'levelup' | 'tick') => {
    if (isInitialized && soundEnabled) {
      audioManager.playSfx(name);
    }
  }, [isInitialized, soundEnabled]);

  const speakQuestion = useCallback((question: any, questionNumber: number, onComplete?: () => void) => {
    if (!voiceEnabled) {
      onComplete?.();
      return;
    }
    setIsSpeaking(true);
    if (!voiceReader.isSupported()) {
      onComplete?.();
      setIsSpeaking(false);
      return;
    }
    voiceReader.speakQuestion(question, questionNumber, voiceSpeed, () => {
      setIsSpeaking(false);
      onComplete?.();
    });
  }, [voiceEnabled, voiceSpeed]);

  const cancelSpeech = useCallback(() => {
    voiceReader.cancel();
    setIsSpeaking(false);
  }, []);

  const readAgain = useCallback((question: any, questionNumber: number) => {
    if (!voiceEnabled) return;
    voiceReader.cancel();
    setIsSpeaking(true);
    if (!voiceReader.isSupported()) {
      setIsSpeaking(false);
      return;
    }
    voiceReader.speakQuestion(question, questionNumber, voiceSpeed, () => {
      setIsSpeaking(false);
    });
  }, [voiceEnabled, voiceSpeed]);

  useEffect(() => {
    return () => {
      voiceReader.cancel();
      audioManager.cleanup();
    };
  }, []);

  return (
    <AudioContext.Provider value={{
      isInitialized,
      volume,
      soundEnabled,
      voiceEnabled,
      voiceSpeed,
      isSpeaking,
      ambianceEnabled,
      ambianceVolume,
      initAudio,
      setVolume,
      toggleSound,
      toggleVoice,
      setVoiceSpeed,
      toggleAmbiance,
      setAmbianceVolume,
      playBgMusic,
      pauseBgMusic,
      playSfx,
      speakQuestion,
      cancelSpeech,
      readAgain,
    }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
