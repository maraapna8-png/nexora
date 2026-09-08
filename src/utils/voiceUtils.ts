// Voice & Speech Recognition / Speech Synthesis Utilities

export interface SpeechRecognitionResultState {
  transcript: string;
  isListening: boolean;
  error?: string;
}

// Map app language settings to BCP 47 language tags for Speech Recognition & TTS
export const LANGUAGE_SPEECH_TAGS: Record<string, string> = {
  'English': 'en-US',
  'Urdu': 'ur-PK',
  'Hindi': 'hi-IN',
  'Arabic': 'ar-SA',
  'Punjabi': 'pa-IN',
  'Auto-detect': 'en-US'
};

// Check if Speech Recognition is supported in user's browser
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && Boolean(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  );
}

// Check if Speech Synthesis (TTS) is supported
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

// Initialize Speech Recognition instance
export function createSpeechRecognizer(
  language: string,
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (error: string) => void,
  onEnd: () => void
): any {
  if (!isSpeechRecognitionSupported()) {
    onError('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or Safari.');
    return null;
  }

  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = LANGUAGE_SPEECH_TAGS[language] || 'en-US';

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const piece = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalTranscript += piece;
      } else {
        interimTranscript += piece;
      }
    }

    const currentTranscript = finalTranscript || interimTranscript;
    if (currentTranscript) {
      onResult(currentTranscript, Boolean(finalTranscript));
    }
  };

  recognition.onerror = (event: any) => {
    console.warn('Speech recognition error:', event.error);
    if (event.error === 'not-allowed') {
      onError('Microphone access was denied. Please allow microphone permissions in your browser.');
    } else if (event.error === 'no-speech') {
      // Ignored for continuous listening
    } else {
      onError(`Speech recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    onEnd();
  };

  return recognition;
}

type VoiceStateListener = (activeId: string | null, isPlaying: boolean, isPaused?: boolean) => void;

// Text to Speech Voice Playback Manager
class VoicePlayer {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private currentPlayingId: string | null = null;
  private currentText: string = '';
  private isPausedState: boolean = false;
  private listeners: Set<VoiceStateListener> = new Set();

  public subscribe(callback: VoiceStateListener): () => void {
    this.listeners.add(callback);
    // Immediately notify current state
    callback(this.currentPlayingId, Boolean(this.currentPlayingId), this.isPausedState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify(id: string | null, isPlaying: boolean, isPaused: boolean = false) {
    this.currentPlayingId = id;
    this.isPausedState = isPaused;
    this.listeners.forEach(cb => {
      try {
        cb(id, isPlaying, isPaused);
      } catch (e) {
        console.error('Error notifying voice listener:', e);
      }
    });
  }

  public speak(
    id: string,
    text: string,
    language: string = 'English',
    rate: number = 1.0,
    onFinish?: () => void
  ) {
    if (!isSpeechSynthesisSupported()) {
      alert('Speech synthesis is not supported in your browser.');
      return;
    }

    // Stop existing speech
    this.stop();

    // Clean text of Markdown symbols (like headings, asterisks, tables, code blocks)
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code snippet omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
      .replace(/[#*_~>|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!cleanText) return;

    this.currentText = cleanText;
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = LANGUAGE_SPEECH_TAGS[language] || 'en-US';
    utterance.rate = rate;
    utterance.pitch = 1.0;

    // Try finding matching voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = utterance.lang.toLowerCase();
    const matchingVoice = voices.find(v => v.lang.toLowerCase().startsWith(langCode.split('-')[0])) || voices[0];
    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => {
      this.currentPlayingId = id;
      this.notify(id, true, false);
    };

    utterance.onpause = () => {
      this.notify(id, true, true);
    };

    utterance.onresume = () => {
      this.notify(id, true, false);
    };

    utterance.onend = () => {
      this.currentPlayingId = null;
      this.currentUtterance = null;
      this.currentText = '';
      this.notify(null, false, false);
      onFinish?.();
    };

    utterance.onerror = (e) => {
      console.warn('Speech playback error:', e);
      this.currentPlayingId = null;
      this.currentUtterance = null;
      this.currentText = '';
      this.notify(null, false, false);
    };

    this.currentUtterance = utterance;
    this.currentPlayingId = id;
    this.notify(id, true, false);
    window.speechSynthesis.speak(utterance);
  }

  public pause() {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      this.notify(this.currentPlayingId, true, true);
    }
  }

  public resume() {
    if (isSpeechSynthesisSupported() && window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      this.notify(this.currentPlayingId, true, false);
    }
  }

  public stop() {
    if (isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
    this.currentPlayingId = null;
    this.currentUtterance = null;
    this.currentText = '';
    this.notify(null, false, false);
  }

  public getCurrentlyPlayingId(): string | null {
    return this.currentPlayingId;
  }

  public getCurrentTextSnippet(): string {
    return this.currentText ? `${this.currentText.slice(0, 60)}...` : '';
  }

  public isPlaying(): boolean {
    return Boolean(this.currentPlayingId);
  }
}

export const voicePlayer = new VoicePlayer();
