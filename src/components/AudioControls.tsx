import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';
import { audioManager } from '@/lib/audio/AudioManager';
import { voiceReader } from '@/lib/audio/VoiceReader';

interface AudioControlsProps {
  currentQuestion?: any;
  questionNumber?: number;
}

export function AudioControls({ currentQuestion, questionNumber }: AudioControlsProps) {
  const {
    soundEnabled,
    voiceEnabled,
    isSpeaking,
    isInitialized,
    toggleSound,
    toggleVoice,
    initAudio,
    cancelSpeech,
  } = useAudio();

  const handleToggleSound = async () => {
    if (!isInitialized) await initAudio();
    const turningOn = !soundEnabled;
    toggleSound();
    if (turningOn) {
      // Bypass context guard — audioManager.soundEnabled is already set by toggleSound
      setTimeout(() => audioManager.playSfx('lock'), 100);
    }
  };

  const handleToggleVoice = async () => {
    if (!isInitialized) await initAudio();
    const turningOn = !voiceEnabled;
    toggleVoice();
    if (turningOn && currentQuestion && questionNumber) {
      // Bypass stale closure — call voiceReader directly since we know voice is now ON
      cancelSpeech();
      setTimeout(() => {
        const speed = audioManager.getSettings().voiceSpeed;
        voiceReader.speakQuestion(currentQuestion, questionNumber, speed);
      }, 200);
    }
  };

  return (
    <div className="flex items-center justify-center gap-3 flex-wrap">
      {/* Sound (SFX) Toggle */}
      <button
        onClick={handleToggleSound}
        className={`
          group relative flex items-center gap-2 px-4 py-2 rounded-full 
          font-semibold text-sm tracking-wide
          transition-all duration-300 ease-out
          ${soundEnabled
            ? 'bg-accent/20 text-accent border border-accent/40 shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.25)]'
            : 'bg-muted/60 text-muted-foreground border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40'
          }
        `}
      >
        <span className={`transition-transform duration-300 ${soundEnabled ? 'scale-110' : 'scale-100'}`}>
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </span>
        <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
        {soundEnabled && (
          <span className="absolute inset-0 rounded-full border border-accent/30 animate-ping opacity-20 pointer-events-none" />
        )}
      </button>

      {/* Voice (TTS) Toggle */}
      <button
        onClick={handleToggleVoice}
        className={`
          group relative flex items-center gap-2 px-4 py-2 rounded-full 
          font-semibold text-sm tracking-wide
          transition-all duration-300 ease-out
          ${voiceEnabled
            ? 'bg-accent/20 text-accent border border-accent/40 shadow-[0_0_20px_rgba(255,215,0,0.15)] hover:shadow-[0_0_30px_rgba(255,215,0,0.25)]'
            : 'bg-muted/60 text-muted-foreground border border-muted-foreground/20 hover:bg-muted/80 hover:border-muted-foreground/40'
          }
        `}
      >
        <span className={`transition-transform duration-300 ${voiceEnabled ? 'scale-110' : 'scale-100'}`}>
          {voiceEnabled ? (
            <Mic className={`w-5 h-5 ${isSpeaking ? 'animate-pulse' : ''}`} />
          ) : (
            <MicOff className="w-5 h-5" />
          )}
        </span>
        <span>Voice {voiceEnabled ? 'ON' : 'OFF'}</span>
        {voiceEnabled && isSpeaking && (
          <span className="absolute inset-0 rounded-full border border-accent/30 animate-ping opacity-20 pointer-events-none" />
        )}
      </button>
    </div>
  );
}
