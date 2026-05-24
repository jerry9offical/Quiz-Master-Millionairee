// AudioManager - Handles background music and SFX for the quiz game
// Respects browser autoplay policies and provides ducking during voice narration

type SfxName = 'lock' | 'correct' | 'wrong' | 'levelup' | 'tick';

interface AudioSettings {
  volume: number; // 0-100
  muted: boolean;
  soundEnabled: boolean; // SFX toggle
  voiceEnabled: boolean;
  voiceSpeed: number; // 0.8-1.2
  ambianceEnabled: boolean;
  ambianceVolume: number; // 0-100
}

const DEFAULT_SETTINGS: AudioSettings = {
  volume: 50,
  muted: false,
  soundEnabled: false,
  voiceEnabled: false,
  voiceSpeed: 1.0,
  ambianceEnabled: false,
  ambianceVolume: 30,
};

const STORAGE_KEY = 'quizmaster_audio_settings';

class AudioManager {
  private bgMusic: HTMLAudioElement | null = null;
  private ambiance: HTMLAudioElement | null = null;
  private sfxCache: Map<SfxName, HTMLAudioElement> = new Map();
  private isUnlocked = false;
  private isDucking = false;
  private settings: AudioSettings;
  private fadeInterval: number | null = null;
  private ambianceFadeInterval: number | null = null;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AudioSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {
      console.warn('Failed to load audio settings:', e);
    }
    return { ...DEFAULT_SETTINGS };
  }

  private saveSettings(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch (e) {
      console.warn('Failed to save audio settings:', e);
    }
  }

  getSettings(): AudioSettings {
    return { ...this.settings };
  }

  setVolume(volume: number): void {
    this.settings.volume = Math.max(0, Math.min(100, volume));
    this.saveSettings();
    this.updateBgVolume();
  }

  setMuted(muted: boolean): void {
    this.settings.muted = muted;
    this.saveSettings();
    this.updateBgVolume();
  }

  setSoundEnabled(enabled: boolean): void {
    this.settings.soundEnabled = enabled;
    this.saveSettings();
    try { localStorage.setItem('audio_sound_enabled', String(enabled)); } catch {}
  }

  setVoiceEnabled(enabled: boolean): void {
    this.settings.voiceEnabled = enabled;
    this.saveSettings();
    try { localStorage.setItem('audio_voice_enabled', String(enabled)); } catch {}
  }

  setVoiceSpeed(speed: number): void {
    this.settings.voiceSpeed = Math.max(0.8, Math.min(1.2, speed));
    this.saveSettings();
  }

  setAmbianceEnabled(enabled: boolean): void {
    this.settings.ambianceEnabled = enabled;
    this.saveSettings();
    if (enabled && this.ambiance) {
      this.playAmbiance();
    } else if (!enabled && this.ambiance) {
      this.pauseAmbiance();
    }
  }

  setAmbianceVolume(volume: number): void {
    this.settings.ambianceVolume = Math.max(0, Math.min(100, volume));
    this.saveSettings();
    this.updateAmbianceVolume();
  }

  private updateAmbianceVolume(): void {
    if (!this.ambiance) return;
    if (this.settings.muted || !this.settings.ambianceEnabled) {
      this.ambiance.volume = 0;
    } else {
      const targetVolume = this.isDucking 
        ? (this.settings.ambianceVolume / 100) * 0.1 
        : (this.settings.ambianceVolume / 100) * 0.2;
      this.ambiance.volume = targetVolume;
    }
  }

  private getEffectiveVolume(): number {
    if (this.settings.muted) return 0;
    return this.settings.volume / 100;
  }

  private updateBgVolume(): void {
    if (!this.bgMusic) return;
    const targetVolume = this.isDucking ? this.getEffectiveVolume() * 0.15 : this.getEffectiveVolume() * 0.3;
    this.bgMusic.volume = targetVolume;
  }

  // Must be called after user interaction to unlock audio context
  async init(): Promise<boolean> {
    if (this.isUnlocked) return true;

    try {
      // Create and load background music (gracefully handle if file doesn't exist)
      this.bgMusic = new Audio('/audio/bg_loop.mp3');
      this.bgMusic.loop = true;
      this.bgMusic.volume = 0;
      
      // Add error handler for missing file
      this.bgMusic.onerror = () => {
        console.warn('Background music file not found - audio will work without it');
        this.bgMusic = null;
      };

      // Create and load ambiance sound
      this.ambiance = new Audio('/audio/bg_ambiance.mp3');
      this.ambiance.loop = true;
      this.ambiance.volume = 0;
      
      this.ambiance.onerror = () => {
        console.warn('Ambiance file not found - will work without it');
        this.ambiance = null;
      };
      
      // Preload SFX (gracefully handle missing files)
      const sfxFiles: Record<SfxName, string> = {
        lock: '/audio/sfx_lock.mp3',
        correct: '/audio/sfx_correct.mp3',
        wrong: '/audio/sfx_wrong.mp3',
        levelup: '/audio/sfx_levelup.mp3',
        tick: '/audio/sfx_tick.mp3',
      };

      for (const [name, path] of Object.entries(sfxFiles)) {
        const audio = new Audio(path);
        audio.preload = 'auto';
        // Only cache if file loads successfully
        audio.oncanplaythrough = () => {
          this.sfxCache.set(name as SfxName, audio);
        };
        audio.onerror = () => {
          console.warn(`SFX file not found: ${path} - will be skipped`);
        };
      }

      // Mark as unlocked immediately - browser policy just needs user gesture
      // The actual audio elements will work when we try to play them
      this.isUnlocked = true;
      console.log('AudioManager initialized successfully');
      return true;
    } catch (e) {
      console.warn('Failed to initialize audio:', e);
      // Still mark as unlocked so the game works without audio
      this.isUnlocked = true;
      return true;
    }
  }

  isInitialized(): boolean {
    return this.isUnlocked;
  }

  async playBg(): Promise<void> {
    console.log('playBg called, bgMusic:', !!this.bgMusic, 'muted:', this.settings.muted, 'volume:', this.settings.volume);
    if (!this.bgMusic || this.settings.muted) return;
    
    try {
      this.bgMusic.volume = 0;
      console.log('Attempting to play background music...');
      await this.bgMusic.play();
      console.log('Background music play() succeeded');
      
      // Fade in to a solid audible volume (0.4 = 40% of max)
      const targetVolume = Math.max(0.4, this.getEffectiveVolume() * 0.5);
      console.log('Fading to target volume:', targetVolume);
      this.fadeVolume(targetVolume, 1000);
    } catch (e) {
      console.warn('Failed to play background music:', e);
    }
  }

  pauseBg(): void {
    if (!this.bgMusic) return;
    this.fadeVolume(0, 300, () => {
      this.bgMusic?.pause();
    });
  }

  // Duck background music and ambiance (lower volume during voice)
  duckBg(): void {
    if (this.isDucking) return;
    this.isDucking = true;
    if (this.bgMusic) {
      this.fadeVolume(this.getEffectiveVolume() * 0.1, 200);
    }
    this.updateAmbianceVolume();
  }

  // Resume normal background volume after voice ends
  resumeBg(): void {
    if (!this.isDucking) return;
    this.isDucking = false;
    if (this.bgMusic) {
      this.fadeVolume(this.getEffectiveVolume() * 0.3, 400);
    }
    this.updateAmbianceVolume();
  }

  async playAmbiance(): Promise<void> {
    if (!this.ambiance || this.settings.muted || !this.settings.ambianceEnabled) return;
    
    try {
      this.ambiance.volume = 0;
      await this.ambiance.play();
      
      // Fade in to target volume
      const targetVol = (this.settings.ambianceVolume / 100) * 0.2;
      this.fadeAmbianceVolume(targetVol, 1000);
    } catch (e) {
      console.warn('Failed to play ambiance:', e);
    }
  }

  pauseAmbiance(): void {
    if (!this.ambiance) return;
    this.fadeAmbianceVolume(0, 300, () => {
      this.ambiance?.pause();
    });
  }

  private fadeAmbianceVolume(targetVolume: number, duration: number, onComplete?: () => void): void {
    if (!this.ambiance) return;
    
    if (this.ambianceFadeInterval) {
      clearInterval(this.ambianceFadeInterval);
    }

    const startVolume = this.ambiance.volume;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    this.ambianceFadeInterval = window.setInterval(() => {
      currentStep++;
      if (this.ambiance) {
        this.ambiance.volume = Math.max(0, Math.min(1, startVolume + volumeStep * currentStep));
      }
      
      if (currentStep >= steps) {
        if (this.ambianceFadeInterval) {
          clearInterval(this.ambianceFadeInterval);
          this.ambianceFadeInterval = null;
        }
        onComplete?.();
      }
    }, stepTime);
  }

  private fadeVolume(targetVolume: number, duration: number, onComplete?: () => void): void {
    if (!this.bgMusic) return;
    
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }

    const startVolume = this.bgMusic.volume;
    const steps = 20;
    const stepTime = duration / steps;
    const volumeStep = (targetVolume - startVolume) / steps;
    let currentStep = 0;

    this.fadeInterval = window.setInterval(() => {
      currentStep++;
      if (this.bgMusic) {
        this.bgMusic.volume = Math.max(0, Math.min(1, startVolume + volumeStep * currentStep));
      }
      
      if (currentStep >= steps) {
        if (this.fadeInterval) {
          clearInterval(this.fadeInterval);
          this.fadeInterval = null;
        }
        onComplete?.();
      }
    }, stepTime);
  }

  async playSfx(name: SfxName): Promise<void> {
    if (this.settings.muted || !this.settings.soundEnabled) return;
    
    const audio = this.sfxCache.get(name);
    if (!audio) return;

    try {
      // Clone to allow overlapping sounds
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.volume = this.getEffectiveVolume() * 0.6;
      await clone.play();
    } catch (e) {
      console.warn(`Failed to play SFX: ${name}`, e);
    }
  }

  cleanup(): void {
    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
    }
    if (this.ambianceFadeInterval) {
      clearInterval(this.ambianceFadeInterval);
    }
    this.bgMusic?.pause();
    this.bgMusic = null;
    this.ambiance?.pause();
    this.ambiance = null;
    this.sfxCache.clear();
    this.isUnlocked = false;
  }
}

// Singleton instance
export const audioManager = new AudioManager();
