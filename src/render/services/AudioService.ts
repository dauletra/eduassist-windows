/**
 * AudioService - управление захватом аудио с микрофона
 * Конфигурация: 16 kHz, mono, PCM16
 */

export type AudioCallback = (audioData: Int16Array) => void;

interface AudioServiceConfig {
  sampleRate: number;
  channelCount: number;
  frameSize: number; // Размер фрейма в сэмплах
}

export class AudioService {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  // private audioWorkletNode: AudioWorkletNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  private config: AudioServiceConfig = {
    sampleRate: 16000,
    channelCount: 1,
    frameSize: 512 // 32 ms при 16 kHz
  };

  private isCapturing = false;
  private callback: AudioCallback | null = null;

  async initialize(): Promise<void> {
    try {
      // Запросить доступ к микрофону
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: this.config.channelCount,
          sampleRate: this.config.sampleRate,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      // Создать AudioContext
      this.audioContext = new AudioContext({
        sampleRate: this.config.sampleRate
      });

      console.log('✅ AudioService initialized:', {
        sampleRate: this.audioContext.sampleRate,
        state: this.audioContext.state
      });
    } catch (error) {
      console.error('❌ Failed to initialize AudioService:', error);
      throw new Error('Не удалось получить доступ к микрофону');
    }
  }

  async startCapture(callback: AudioCallback): Promise<void> {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('AudioService not initialized');
    }

    if (this.isCapturing) {
      console.warn('⚠️ Audio capture already running');
      return;
    }

    this.callback = callback;
    this.isCapturing = true;

    // Создать источник из микрофона
    this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Создать ScriptProcessorNode для обработки аудио
    // (deprecated, но работает надежно; можно заменить на AudioWorklet позже)
    const processor = this.audioContext.createScriptProcessor(
      this.config.frameSize,
      this.config.channelCount,
      this.config.channelCount
    );

    processor.onaudioprocess = (event) => {
      if (!this.isCapturing || !this.callback) return;

      const inputData = event.inputBuffer.getChannelData(0);

      // Конвертировать Float32Array в Int16Array (PCM16)
      const pcm16 = this.float32ToInt16(inputData);

      this.callback(pcm16);
    };

    // Подключить: source -> processor -> destination
    this.source.connect(processor);
    processor.connect(this.audioContext.destination);

    console.log('🎤 Audio capture started');
  }

  stopCapture(): void {
    if (!this.isCapturing) return;

    this.isCapturing = false;
    this.callback = null;

    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }

    console.log('🛑 Audio capture stopped');
  }

  async dispose(): Promise<void> {
    this.stopCapture();

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    console.log('🗑️ AudioService disposed');
  }

  getState(): 'active' | 'inactive' | 'not-initialized' {
    if (!this.audioContext) return 'not-initialized';
    if (this.isCapturing) return 'active';
    return 'inactive';
  }

  // Конвертация Float32 (-1.0 to 1.0) в Int16 (-32768 to 32767)
  private float32ToInt16(float32Array: Float32Array): Int16Array {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }
}

export const audioService = new AudioService();