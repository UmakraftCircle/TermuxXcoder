/**
 * Umakraft Speech & Voice Engine
 * Handles Text-to-Speech (TTS) reading aloud and Speech-to-Text (STT) mic dictation
 */

export interface VoiceOption {
  name: string;
  lang: string;
  voiceURI: string;
  default: boolean;
}

class SpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingActive: boolean = false;
  private activeMessageId: string | null = null;
  private onSpeakingStateChangeListeners: Array<(isSpeaking: boolean, messageId: string | null) => void> = [];
  
  // Speech Recognition
  private recognition: any = null;
  private isListeningActive: boolean = false;
  private onListeningStateChangeListeners: Array<(isListening: boolean) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
    }
  }

  public isTtsSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public isSttSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    );
  }

  public getAvailableVoices(): VoiceOption[] {
    if (!this.synth) return [];
    const rawVoices = this.synth.getVoices();
    return rawVoices
      .filter((v) => v.lang.startsWith('en') || v.lang.startsWith('fil') || v.default)
      .map((v) => ({
        name: v.name,
        lang: v.lang,
        voiceURI: v.voiceURI,
        default: v.default
      }));
  }

  /**
   * Intelligently cleans raw AI Markdown and code fences so speech synthesis
   * sounds natural, fluent, and pleasant to listen to without reading raw punctuation.
   */
  public cleanTextForSpeech(text: string): string {
    if (!text) return '';

    let clean = text;

    // Replace code blocks with a natural spoken prompt
    clean = clean.replace(/```(?:kotlin|java|cpp|c|yaml|groovy|json|bash|sh|xml|kts)?\n([\s\S]*?)```/g, (_match, code) => {
      const lineCount = (code.match(/\n/g) || []).length + 1;
      return ` Here is the generated code block containing ${lineCount} lines. You can inspect or apply it in the editor. `;
    });

    // Remove markdown headers
    clean = clean.replace(/^#+\s+/gm, '');

    // Replace bold/italic asterisks
    clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
    clean = clean.replace(/\*(.*?)\*/g, '$1');
    clean = clean.replace(/__(.*?)__/g, '$1');
    clean = clean.replace(/_(.*?)_/g, '$1');

    // Remove inline code backticks
    clean = clean.replace(/`([^`]+)`/g, '$1');

    // Clean bullets and numbered lists
    clean = clean.replace(/^\s*[-*•]\s+/gm, 'Point: ');
    clean = clean.replace(/^\s*\d+\.\s+/gm, 'Step: ');

    // Clean emojis and weird symbols
    clean = clean.replace(/[\u{1F300}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

    // Clean multiple line breaks and spaces
    clean = clean.replace(/\n+/g, '. ');
    clean = clean.replace(/\s+/g, ' ').trim();

    return clean;
  }

  /**
   * Speaks the text aloud using browser SpeechSynthesis
   */
  public speak(
    text: string,
    messageId: string,
    options?: {
      rate?: number;
      pitch?: number;
      voiceURI?: string;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ): void {
    if (!this.synth) {
      options?.onError?.(new Error('Speech Synthesis is not supported in this browser.'));
      return;
    }

    // Stop previous utterance
    this.stop();

    const spokenText = this.cleanTextForSpeech(text);
    if (!spokenText.trim()) return;

    try {
      const utterance = new SpeechSynthesisUtterance(spokenText);
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;

      // Match voice if specified
      if (options?.voiceURI) {
        const voices = this.synth.getVoices();
        const matched = voices.find((v) => v.voiceURI === options.voiceURI);
        if (matched) utterance.voice = matched;
      } else {
        const voices = this.synth.getVoices();
        const defaultEnglish = voices.find(
          (v) => (v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Premium'))) || v.default
        );
        if (defaultEnglish) utterance.voice = defaultEnglish;
      }

      utterance.onstart = () => {
        this.isSpeakingActive = true;
        this.activeMessageId = messageId;
        this.notifySpeakingListeners(true, messageId);
      };

      utterance.onend = () => {
        this.isSpeakingActive = false;
        this.activeMessageId = null;
        this.notifySpeakingListeners(false, null);
        options?.onEnd?.();
      };

      utterance.onerror = (e) => {
        this.isSpeakingActive = false;
        this.activeMessageId = null;
        this.notifySpeakingListeners(false, null);
        options?.onError?.(e);
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      this.isSpeakingActive = false;
      this.activeMessageId = null;
      this.notifySpeakingListeners(false, null);
      options?.onError?.(err);
    }
  }

  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch (e) {
        console.error('Error cancelling speech synthesis:', e);
      }
    }
    this.isSpeakingActive = false;
    this.activeMessageId = null;
    this.currentUtterance = null;
    this.notifySpeakingListeners(false, null);
  }

  public isSpeaking(): boolean {
    return this.isSpeakingActive;
  }

  public getActiveMessageId(): string | null {
    return this.activeMessageId;
  }

  public onSpeakingStateChange(listener: (isSpeaking: boolean, messageId: string | null) => void): () => void {
    this.onSpeakingStateChangeListeners.push(listener);
    return () => {
      this.onSpeakingStateChangeListeners = this.onSpeakingStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifySpeakingListeners(isSpeaking: boolean, messageId: string | null) {
    this.onSpeakingStateChangeListeners.forEach((l) => l(isSpeaking, messageId));
  }

  // --- SPEECH RECOGNITION (MIC DICTATION) ---

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): () => void {
    if (!this.isSttSupported()) {
      onError('Speech Recognition is not supported on this browser.');
      return () => {};
    }

    try {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      this.recognition = new SpeechRecognitionConstructor();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        this.notifyListeningListeners(true);
      };

      this.recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        const text = final || interim;
        onResult(text, Boolean(final));
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        this.notifyListeningListeners(false);
        onError(event.error || 'Speech recognition error');
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        this.notifyListeningListeners(false);
        onEnd();
      };

      this.recognition.start();

      return () => {
        this.stopListening();
      };
    } catch (err: any) {
      onError(err.message || 'Could not start speech recognition');
      return () => {};
    }
  }

  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
      this.recognition = null;
    }
    this.isListeningActive = false;
    this.notifyListeningListeners(false);
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  public onListeningStateChange(listener: (isListening: boolean) => void): () => void {
    this.onListeningStateChangeListeners.push(listener);
    return () => {
      this.onListeningStateChangeListeners = this.onListeningStateChangeListeners.filter((l) => l !== listener);
    };
  }

  private notifyListeningListeners(isListening: boolean) {
    this.onListeningStateChangeListeners.forEach((l) => l(isListening));
  }
}

export const speechService = new SpeechService();
