// src/render/services/CommandEventBus.ts

type VoiceCommandHandler = (data: any) => void;

class CommandEventBus {
  private handlers: Map<string, Set<VoiceCommandHandler>> = new Map();

  // Подписаться на команду определённого типа
  subscribe(commandType: string, handler: VoiceCommandHandler): () => void {
    if (!this.handlers.has(commandType)) {
      this.handlers.set(commandType, new Set());
    }

    this.handlers.get(commandType)!.add(handler);
    console.log(`📡 Subscribed to voice command: ${commandType}`);

    // Возвращаем функцию отписки
    return () => {
      this.handlers.get(commandType)?.delete(handler);
      console.log(`📡 Unsubscribed from voice command: ${commandType}`);
    };
  }

  // Отправить команду
  emit(commandType: string, data: any): void {
    console.log(`📢 Voice command emitted: ${commandType}`, data);

    const handlers = this.handlers.get(commandType);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in voice command handler for ${commandType}:`, error);
        }
      });
    } else {
      console.warn(`⚠️ No handlers registered for voice command: ${commandType}`);
    }
  }

  // Очистить все подписки (для cleanup)
  clear(): void {
    this.handlers.clear();
  }
}

// Singleton instance
export const commandEventBus = new CommandEventBus();
