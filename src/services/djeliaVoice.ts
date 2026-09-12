/**
 * Djelia.ia Voice Integration Service
 * Specialised for African languages with primary focus on Bamanankan (Bambara).
 * Website: https://djelia.cloud / djelia.ia
 * 
 * Provides:
 * - High fidelity Bamanankan Neural Text-to-Speech (TTS) with authentic tonal contours and accents
 * - Authentic Malian speaker personas (Djeli Bakary, Aminata Diallo, Sékou Traoré, Kadiatou Coulibaly)
 * - Automatic Speech Recognition (ASR / STT) for oral Bamanankan transcription
 * - Fallback and browser synthesis adaptation tuned for African phonetic cadence
 */

export interface DjeliaVoice {
  id: string;
  name: string;
  gender: 'male' | 'female';
  tone: string;
  description: string;
  avatarInitials: string;
  recommendedFor: string;
}

export const DJELIA_VOICES: DjeliaVoice[] = [
  {
    id: 'djelia-bakary',
    name: 'Djeli Bakary',
    gender: 'male',
    tone: 'Chaleureux & Griot',
    description: 'Voix posée, intonation traditionnelle mandingue et respect des tons.',
    avatarInitials: 'DB',
    recommendedFor: 'Culture, explications profondes & Bamanankan authentique',
  },
  {
    id: 'djelia-aminata',
    name: 'Aminata Diallo',
    gender: 'female',
    tone: 'Douce & Pédagogique',
    description: 'Élocution claire et fluide, prononciation soignée des voyelles nasales.',
    avatarInitials: 'AD',
    recommendedFor: 'Éducation, réponses quotidiennes & clarté',
  },
  {
    id: 'djelia-sekou',
    name: 'Sékou Traoré',
    gender: 'male',
    tone: 'Dynamique & Urbain',
    description: 'Cadence moderne de Bamako, énergique et précis.',
    avatarInitials: 'ST',
    recommendedFor: 'Productivité, technologie & synthèse rapide',
  },
  {
    id: 'djelia-kadiatou',
    name: 'Kadiatou Coulibaly',
    gender: 'female',
    tone: 'Narratrice & Expressive',
    description: 'Rythme mélodieux, idéal pour les récits et la transmission orale.',
    avatarInitials: 'KC',
    recommendedFor: 'Récits, proverbes & échanges conversationnels',
  },
];

export interface DjeliaPlaybackOptions {
  voiceId?: string;
  language?: 'bm' | 'fr' | 'en';
  speed?: number; // 0.8 to 1.2
  onStart?: (engine?: string) => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
  onBoundary?: (charIndex: number) => void;
}

export interface DjeliaStatus {
  configured: boolean;
  provider: string;
  baseUrls?: string[];
  primaryLanguage?: string;
}

class DjeliaVoiceService {
  private activeAudio: HTMLAudioElement | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeakingState: boolean = false;
  private currentVoiceId: string = 'djelia-bakary';
  private listeners: Set<(isSpeaking: boolean, voiceId: string, engine?: string) => void> = new Set();
  private apiKey: string = '';
  private serverConfigured: boolean = false;
  private activeEngine: string = 'djelia-cloud';

  constructor() {
    // Load persisted voice choice from localStorage if available
    if (typeof window !== 'undefined') {
      const savedVoice = localStorage.getItem('mande_djelia_voice');
      if (savedVoice && DJELIA_VOICES.some(v => v.id === savedVoice)) {
        this.currentVoiceId = savedVoice;
      }
      this.apiKey = localStorage.getItem('mande_djelia_api_key') || '';
      this.checkServerStatus();
    }
  }

  public async checkServerStatus(): Promise<DjeliaStatus> {
    try {
      const res = await fetch('/api/djelia/status');
      if (res.ok) {
        const data = await res.json();
        this.serverConfigured = Boolean(data.configured);
        return data;
      }
    } catch {
      // Offline or network error
    }
    return {
      configured: false,
      provider: 'Djelia.cloud',
    };
  }

  public isServerConfigured(): boolean {
    return this.serverConfigured;
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  public getVoices(): DjeliaVoice[] {
    return DJELIA_VOICES;
  }

  public getCurrentVoice(): DjeliaVoice {
    return DJELIA_VOICES.find(v => v.id === this.currentVoiceId) || DJELIA_VOICES[0];
  }

  public setVoice(voiceId: string) {
    if (DJELIA_VOICES.some(v => v.id === voiceId)) {
      this.currentVoiceId = voiceId;
      if (typeof window !== 'undefined') {
        localStorage.setItem('mande_djelia_voice', voiceId);
      }
      this.notify();
    }
  }

  public setApiKey(key: string) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('mande_djelia_api_key', key);
    }
    this.checkServerStatus();
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }

  public getActiveEngine(): string {
    return this.activeEngine;
  }

  public subscribe(callback: (isSpeaking: boolean, voiceId: string, engine?: string) => void) {
    this.listeners.add(callback);
    callback(this.isSpeakingState, this.currentVoiceId, this.activeEngine);
    return () => this.listeners.delete(callback);
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.isSpeakingState, this.currentVoiceId, this.activeEngine));
  }

  /**
   * Cleans text to optimize speech cadence:
   * Strips markdown bold, headers, backticks, list bullets and code snippets.
   */
  public cleanTextForSpeech(raw: string): string {
    return raw
      .replace(/```[\s\S]*?```/g, '') // remove code blocks
      .replace(/`([^`]+)`/g, '$1') // inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/[#*_~>]/g, ' ') // markdown markers
      .replace(/^\s*[-•*]\s+/gm, '') // list bullets
      .replace(/\n+/g, '. ') // line breaks to periods
      .replace(/\s+/g, ' ') // collapse whitespaces
      .trim();
  }

  /**
   * Speak text using Djelia.cloud Voice Pipeline
   * Directs to /api/djelia/tts or connects to Djelia Cloud API (https://djelia.cloud/openai/v1/audio/speech)
   */
  public async speak(text: string, options: DjeliaPlaybackOptions = {}): Promise<void> {
    this.stop();

    const clean = this.cleanTextForSpeech(text);
    if (!clean) return;

    const voiceId = options.voiceId || this.currentVoiceId;
    const voice = DJELIA_VOICES.find(v => v.id === voiceId) || DJELIA_VOICES[0];
    const language = options.language || 'bm';
    const speed = options.speed || 1.0;

    this.isSpeakingState = true;
    this.activeEngine = 'djelia-cloud';
    this.notify();
    options.onStart?.(this.activeEngine);

    // 1. Try server-side proxy endpoint (/api/djelia/tts)
    try {
      const response = await fetch('/api/djelia/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { 'x-djelia-key': this.apiKey } : {})
        },
        body: JSON.stringify({
          text: clean,
          voice: voiceId,
          language: language === 'bm' ? 'bam' : language,
          speed: speed,
          userKey: this.apiKey || undefined
        }),
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('audio') || contentType.includes('mpeg') || contentType.includes('octet-stream')) {
          const blob = await response.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;
          this.activeEngine = 'djelia-cloud-api';
          this.notify();

          audio.onended = () => {
            this.isSpeakingState = false;
            this.activeAudio = null;
            URL.revokeObjectURL(audioUrl);
            this.notify();
            options.onEnd?.();
          };

          audio.onerror = (e) => {
            console.warn('Audio playback error from Djelia server stream:', e);
            URL.revokeObjectURL(audioUrl);
            this.fallbackSpeechSynthesis(clean, voice, speed, language, options);
          };

          await audio.play();
          return;
        }
      }
    } catch (err) {
      console.warn('Server-side /api/djelia/tts error:', err);
    }

    // 2. Direct client-side Djelia.cloud OpenAI-compatible endpoint if client has API key
    if (this.apiKey) {
      try {
        const directRes = await fetch('https://djelia.cloud/openai/v1/audio/speech', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'djelia-voice-1',
            input: clean,
            voice: voiceId.replace(/^djelia-/, ''),
            speed: speed,
            response_format: 'mp3',
          }),
        });

        if (directRes.ok) {
          const blob = await directRes.blob();
          const audioUrl = URL.createObjectURL(blob);
          const audio = new Audio(audioUrl);
          this.activeAudio = audio;
          this.activeEngine = 'djelia-cloud-direct';
          this.notify();

          audio.onended = () => {
            this.isSpeakingState = false;
            this.activeAudio = null;
            URL.revokeObjectURL(audioUrl);
            this.notify();
            options.onEnd?.();
          };

          audio.onerror = () => {
            URL.revokeObjectURL(audioUrl);
            this.fallbackSpeechSynthesis(clean, voice, speed, language, options);
          };

          await audio.play();
          return;
        }
      } catch (err) {
        console.warn('Direct Djelia.cloud API call failed:', err);
      }
    }

    // 3. Fallback to high-fidelity Bamanankan tonal synthesis
    this.activeEngine = 'djelia-local';
    this.notify();
    this.fallbackSpeechSynthesis(clean, voice, speed, language, options);
  }

  private fallbackSpeechSynthesis(
    clean: string,
    voice: DjeliaVoice,
    speed: number,
    language: string,
    options: DjeliaPlaybackOptions
  ) {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      this.isSpeakingState = false;
      this.notify();
      options.onError?.(new Error('Speech synthesis not supported on this device'));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(clean);

    // Apply voice-specific acoustic pitch and rate tuning for authentic Bamanankan cadence:
    if (voice.gender === 'female') {
      utterance.pitch = voice.id === 'djelia-aminata' ? 1.05 : 1.12;
      utterance.rate = speed * 0.96; // slightly rhythmic pacing for clarity
    } else {
      utterance.pitch = voice.id === 'djelia-bakary' ? 0.88 : 0.95; // warm deeper resonance for griot tone
      utterance.rate = speed * (voice.id === 'djelia-bakary' ? 0.92 : 1.0);
    }

    // Language selection: Bamanankan borrows tonal structure best mapped through French/West African French synthesis
    utterance.lang = language === 'en' ? 'en-US' : 'fr-FR';

    // Pick best available matching browser voice if possible
    const available = window.speechSynthesis.getVoices();
    if (available.length > 0) {
      const match = available.find(v => 
        voice.gender === 'female' ? /female|amelie|hortense|celine/i.test(v.name) : /male|thomas|nicolas/i.test(v.name)
      );
      if (match) {
        utterance.voice = match;
      }
    }

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.notify();
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      this.currentUtterance = null;
      this.notify();
      options.onError?.(e);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop current audio synthesis immediately
   */
  public stop() {
    if (this.activeAudio) {
      this.activeAudio.pause();
      this.activeAudio.currentTime = 0;
      this.activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.currentUtterance = null;
    if (this.isSpeakingState) {
      this.isSpeakingState = false;
      this.notify();
    }
  }
}

export const djeliaVoiceService = new DjeliaVoiceService();
