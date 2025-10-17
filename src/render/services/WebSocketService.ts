/**
 * WebSocketService - управление WebSocket соединением для стриминга STT
 */

interface WebSocketMessage {
  type: 'ready' | 'partial' | 'final' | 'session' | 'info' | 'error';
  text?: string;
  raw?: any;
  event?: string;
  reason?: string;
  error?: string;
}

interface WebSocketCallbacks {
  onReady?: () => void;
  onPartial?: (text: string) => void;
  onFinal?: (text: string, raw?: any) => void;
  onError?: (error: string) => void;
}

interface WebSocketConfig {
  baseUrl: string;
  apiKey: string;
  language: string;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private callbacks: WebSocketCallbacks = {};
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 500; // Initial delay in ms
  private isIntentionallyClosed = false;

  constructor(config: WebSocketConfig) {
    this.config = config;
  }

  async connect(callbacks: WebSocketCallbacks): Promise<void> {
    // ВАЖНО: Полностью заменить callbacks, а не объединять
    this.callbacks = callbacks;

    console.log('📋 WebSocket callbacks updated:', {
      hasOnReady: !!this.callbacks.onReady,
      hasOnPartial: !!this.callbacks.onPartial,
      hasOnFinal: !!this.callbacks.onFinal,
      hasOnError: !!this.callbacks.onError
    });

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      console.log('✅ WebSocket already connected, reusing connection');
      // Соединение уже открыто, просто вызываем onReady
      this.callbacks.onReady?.();
      return;
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      console.log('⏳ WebSocket is connecting, waiting...');
      return;
    }

    this.isIntentionallyClosed = false;

    const wsUrl = this.buildWebSocketUrl();
    console.log('🔌 Connecting to WebSocket:', wsUrl);

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(wsUrl);
        this.ws.binaryType = 'arraybuffer';

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.reconnectAttempts = 0;
          this.reconnectDelay = 500;
          resolve();
        };

        this.ws.onmessage = (event) => {
          if (typeof event.data === 'string') {
            this.handleMessage(event.data);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.callbacks.onError?.(
            'Ошибка соединения с сервером распознавания речи'
          );
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket closed:', event.code, event.reason);

          if (!this.isIntentionallyClosed) {
            this.handleReconnect();
          }
        };
      } catch (error) {
        console.error('❌ Failed to create WebSocket:', error);
        reject(error);
      }
    });
  }

  send(audioData: Int16Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not ready, cannot send audio');
      return;
    }

    // Отправляем binary data напрямую
    this.ws.send(audioData.buffer);
  }

  stop(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ WebSocket not open, cannot send stop event');
      return;
    }

    console.log('🛑 Sending stop event to WebSocket (connection stays open)');

    // Отправляем событие stop, но НЕ закрываем соединение
    this.ws.send(JSON.stringify({ event: 'stop' }));
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close(1000, 'Client closed');
      }
      this.ws = null;
    }

    console.log('🔌 WebSocket disconnected');
  }

  private buildWebSocketUrl(): string {
    const wsBase = this.config.baseUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    const params = new URLSearchParams({
      language: this.config.language,
      api_key: this.config.apiKey,
      normalize: '1'
    });

    return `${wsBase}/v1/speech/stt/stream?${params.toString()}`;
  }

  private handleMessage(data: string): void {
    try {
      const message: WebSocketMessage = JSON.parse(data);

      switch (message.type) {
        case 'ready':
          console.log('✅ STT Ready');
          console.log('🔔 Calling onReady callback...');
          this.callbacks.onReady?.();
          break;

        case 'partial':
          if (message.text) {
            console.log('📝 Partial:', message.text);
            console.log('🔔 Calling onPartial callback...');
            this.callbacks.onPartial?.(message.text);
          }
          break;

        case 'final':
          if (message.text) {
            console.log('✅ Final:', message.text);
            console.log('🔔 Calling onFinal callback with text:', message.text);
            console.log('🔔 onFinal exists?', !!this.callbacks.onFinal);
            this.callbacks.onFinal?.(message.text, message.raw);
            console.log('🔔 onFinal callback completed');
          }
          break;

        case 'session':
          console.log('📡 Session event:', message.event);
          break;

        case 'info':
          console.log('ℹ️ Info:', message.event);
          break;

        case 'error':
          console.error('❌ STT Error:', message.error);
          this.callbacks.onError?.(message.error || 'Unknown error');
          break;

        default:
          console.log('🔔 Unknown message type:', message);
      }
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error);
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnect attempts reached');
      this.callbacks.onError?.('Не удалось подключиться к серверу');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
      10000
    );

    console.log(
      `🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      // Сохраняем текущие callbacks перед переподключением
      const currentCallbacks = { ...this.callbacks };
      this.connect(currentCallbacks).catch((error) => {
        console.error('❌ Reconnect failed:', error);
      });
    }, delay);
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const createWebSocketService = (config: WebSocketConfig) =>
  new WebSocketService(config);