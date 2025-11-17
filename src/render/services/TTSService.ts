// src/render/services/TTSService.ts
/**
 * TTSService - голосовые ответы ассистента
 * Поддержка кэшированных фраз + динамический TTS через Azure API
 */

interface TTSConfig {
  baseUrl: string;
  apiKey: string;
  voiceName: string;
  locale: string;
  enabled: boolean;
}

interface CachedPhrase {
  text: string;
  audioData?: ArrayBuffer;
  loading?: boolean;
}

export class TTSService {
  private config: TTSConfig;
  private audioContext: AudioContext | null = null;
  private cache: Map<string, CachedPhrase> = new Map();
  private currentSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;

  constructor(config: TTSConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    try {
      this.audioContext = new AudioContext({ sampleRate: 16000 });
      console.log('✅ TTSService initialized');
    } catch (error) {
      console.error('❌ Failed to initialize TTSService:', error);
      throw error;
    }
  }

  /**
   * Произнести фразу (кэш или API)
   */
  async speak(text: string): Promise<void> {
    if (!this.config.enabled) {
      console.log('🔇 TTS disabled, skipping:', text);
      return;
    }

    if (!this.audioContext) {
      console.warn('⚠️ TTSService not initialized');
      return;
    }

    // Остановить текущее воспроизведение
    this.stop();

    try {
      console.log('🔊 Speaking:', text);

      // Проверить кэш
      if (this.cache.has(text)) {
        const cached = this.cache.get(text)!;
        if (cached.audioData) {
          await this.playAudio(cached.audioData);
          return;
        }
      }

      // Запросить через API
      const audioData = await this.fetchTTS(text);

      // Сохранить в кэш
      this.cache.set(text, { text, audioData });

      await this.playAudio(audioData);
    } catch (error) {
      console.error('❌ TTS speak failed:', error);
    }
  }

  /**
   * Загрузить фразу в кэш (предварительная загрузка)
   */
  async preloadPhrase(text: string): Promise<void> {
    if (this.cache.has(text) && this.cache.get(text)?.audioData) {
      return; // Уже в кэше
    }

    try {
      console.log('📥 Preloading phrase:', text);
      const audioData = await this.fetchTTS(text);
      this.cache.set(text, { text, audioData });
      console.log('✅ Phrase cached:', text);
    } catch (error) {
      console.error('❌ Failed to preload phrase:', text, error);
    }
  }

  /**
   * Предзагрузить все важные фразы
   */
  async preloadCommonPhrases(phrases:readonly string[]): Promise<void> {
    console.log('📥 Preloading', phrases.length, 'common phrases...');
    await Promise.allSettled(phrases.map(phrase => this.preloadPhrase(phrase)));
    console.log('✅ Common phrases preloaded');
  }

  /**
   * Запросить TTS через Azure API
   */
  private async fetchTTS(text: string): Promise<ArrayBuffer> {
    const url = `${this.config.baseUrl}/v1/speech/tts`;

    // Создаем SSML с cheerful стилем и повышенной интонацией
    const ssml = this.createSSML(text);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.config.apiKey,
      },
      body: JSON.stringify({
        text: ssml,
        voiceName: this.config.voiceName,
        format: 'riff-16khz-16bit-mono-pcm',
        ssml: true
      }),
    });

    if (!response.ok) {
      throw new Error(`TTS API failed: ${response.status}`);
    }

    return await response.arrayBuffer();
  }

  /**
   * Создать SSML с эмоциональным стилем
   */
  private createSSML(text: string): string {
    return `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" 
             xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${this.config.locale}">
        <voice name="${this.config.voiceName}">
          <mstts:express-as style="cheerful" styledegree="1.5">
            <prosody rate="1.05" pitch="+5%">
              ${text}
            </prosody>
          </mstts:express-as>
        </voice>
      </speak>
    `.trim();
  }

  /**
   * Воспроизвести аудио
   */
  private async playAudio(audioData: ArrayBuffer): Promise<void> {
    if (!this.audioContext) return;

    try {
      const audioBuffer = await this.audioContext.decodeAudioData(audioData.slice(0));

      this.currentSource = this.audioContext.createBufferSource();
      this.currentSource.buffer = audioBuffer;
      this.currentSource.connect(this.audioContext.destination);

      this.isPlaying = true;

      return new Promise<void>((resolve) => {
        this.currentSource!.onended = () => {
          this.isPlaying = false;
          this.currentSource = null;
          resolve();
        };

        this.currentSource!.start(0);
      });
    } catch (error) {
      this.isPlaying = false;
      console.error('❌ Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Остановить текущее воспроизведение
   */
  stop(): void {
    if (this.currentSource && this.isPlaying) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch (e) {
        // Игнорируем ошибки при остановке
      }
      this.currentSource = null;
      this.isPlaying = false;
    }
  }

  /**
   * Включить/выключить TTS
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.stop();
    }
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Очистить кэш
   */
  clearCache(): void {
    this.cache.clear();
    console.log('🗑️ TTS cache cleared');
  }

  /**
   * Освободить ресурсы
   */
  async dispose(): Promise<void> {
    console.log('🗑️ Disposing TTSService...');
    this.stop();
    this.clearCache();

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log('✅ TTSService disposed');
  }
}

/**
 * Factory функция
 */
export const createTTSService = (config: TTSConfig) => new TTSService(config);