// VoiceReader - Text-to-Speech using Web Speech API
// Reads questions and options with automatic pausing for user interactions

import { audioManager } from './AudioManager';

interface QuestionData {
  stem: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
}

class VoiceReader {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isReading = false;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private onReadingComplete: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoice();
    }
  }

  private loadVoice(): void {
    if (!this.synth) return;

    const setVoice = () => {
      const voices = this.synth!.getVoices();
      // Prefer English voices (UK or US)
      this.preferredVoice = 
        voices.find(v => v.lang === 'en-GB' && v.name.includes('Google')) ||
        voices.find(v => v.lang === 'en-US' && v.name.includes('Google')) ||
        voices.find(v => v.lang.startsWith('en-GB')) ||
        voices.find(v => v.lang.startsWith('en-US')) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] || null;
    };

    // Voices may load asynchronously
    if (this.synth.getVoices().length > 0) {
      setVoice();
    }
    this.synth.onvoiceschanged = setVoice;
  }

  isSupported(): boolean {
    return this.synth !== null;
  }

  isSpeaking(): boolean {
    return this.isReading;
  }

  cancel(): void {
    if (!this.synth) return;
    this.synth.cancel();
    this.isReading = false;
    this.currentUtterance = null;
    audioManager.resumeBg();
  }

  async speakQuestion(
    questionData: QuestionData, 
    questionNumber: number,
    speed: number = 1.0,
    onComplete?: () => void,
    totalQuestions: number = 15
  ): Promise<void> {
    if (!this.synth) {
      onComplete?.();
      return;
    }

    this.cancel(); // Cancel any ongoing speech
    this.onReadingComplete = onComplete || null;

    // Duck background music
    audioManager.duckBg();

    const textParts = [
      `Question ${questionNumber} of ${totalQuestions}.`,
      questionData.stem,
      `Option A: ${questionData.option_a}.`,
      `Option B: ${questionData.option_b}.`,
      `Option C: ${questionData.option_c}.`,
      `Option D: ${questionData.option_d}.`,
    ];

    this.isReading = true;

    for (let i = 0; i < textParts.length; i++) {
      if (!this.isReading) break; // User cancelled

      await this.speak(textParts[i], speed);
      
      // Short pause between parts (except last)
      if (i < textParts.length - 1 && this.isReading) {
        await this.pause(200);
      }
    }

    this.isReading = false;
    audioManager.resumeBg();
    this.onReadingComplete?.();
  }

  async speakText(text: string, speed: number = 1.0): Promise<void> {
    if (!this.synth) return;

    audioManager.duckBg();
    await this.speak(text, speed);
    audioManager.resumeBg();
  }

  private speak(text: string, speed: number): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = this.preferredVoice;
      utterance.rate = speed;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  private pause(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const voiceReader = new VoiceReader();
