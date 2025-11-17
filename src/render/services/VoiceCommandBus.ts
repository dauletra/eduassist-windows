// src/render/services/VoiceCommandBus.ts
type VoiceEvent =
  | 'speech-recognized'      // STT завершил распознавание
  | 'command-recognized'     // Команда распознана CLU
  | 'command-executed'       // ✅ НОВОЕ: Команда успешно выполнена
  | 'command-failed'         // ✅ НОВОЕ: Команда завершилась с ошибкой
  | 'assistant-question'
  | 'assistant-message'
  | 'voice-error'
  | 'state-changed';

interface VoiceEventMap {
  'speech-recognized': {     // ✅ НОВОЕ: только текст от STT
    text: string;
  };
  'command-recognized': {
    text: string;
    intent: string;
    entities: any[];
    cluResponse: any;
  };
  'command-executed': {      // ✅ НОВОЕ
    commandType: string;
    params: Record<string, any>;
    result: {
      success: boolean;
      message: string;
      data?: any;
      needsClarification?: boolean;
      clarificationQuestion?: string;
    };
  };
  'command-failed': {        // ✅ НОВОЕ
    commandType: string;
    params?: Record<string, any>;
    error: string;
  };
  'assistant-question': string | null;
  'assistant-message': string | null;
  'voice-error': string | null;
  'state-changed': string;
}

type Listener<T extends VoiceEvent> = (data: VoiceEventMap[T]) => void;

export class VoiceCommandBus {
  private listeners: Partial<{ [K in VoiceEvent]: Listener<K>[] }> = {};

  publish<T extends VoiceEvent>(event: T, data: VoiceEventMap[T]): void {
    const eventListeners = this.listeners[event] as Listener<T>[];
    if (eventListeners) {
      eventListeners.forEach(listener => listener(data));
    }
  }

  subscribe<T extends VoiceEvent>(event: T, listener: Listener<T>): () => void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(listener);

    return () => this.unsubscribe(event, listener);
  }

  unsubscribe<T extends VoiceEvent>(event: T, listener: Listener<T>): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      this.listeners[event] = eventListeners.filter(l => l !== listener) as any;
    }
  }
}

// Singleton instance
export const voiceCommandBus = new VoiceCommandBus();