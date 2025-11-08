// import type {Student} from "../../../electron/shared-types.ts";

export interface CommandContext {
  classId?: string;
  groupId?: string;
  lessonId?: string;
}

export interface DialogTurn {
  timestamp: number;
  type: 'user' | 'assistant';
  text: string;
  intent?: string;
  entities?: any[];
}

export interface ActiveIntent {
  name: string;
  slots: Record<string, any>; // заполненные слоты
  startedAt: number;
}

export class DialogState {
  private history: DialogTurn[] = [];
  private activeIntent: ActiveIntent | null = null;
  private readonly INTENT_TIMEOUT = 30000; // 30 сек

  // Active Intent
  setActiveIntent(name: string, slots: Record<string, any> = {}): void {
    this.activeIntent = {
      name,
      slots,
      startedAt: Date.now()
    };
  }

  updateSlots(newSlots: Record<string, any>): void {
    if (this.activeIntent) {
      this.activeIntent.slots = { ...this.activeIntent.slots, ...newSlots };
    }
  }

  getActiveIntent(): ActiveIntent | null {
    // Проверить timeout
    if (this.activeIntent && Date.now() - this.activeIntent.startedAt > this.INTENT_TIMEOUT) {
      console.log('⏱️ Intent timeout, resetting...');
      this.activeIntent = null;
    }
    return this.activeIntent;
  }

  clearActiveIntent(): void {
    this.activeIntent = null;
  }

  // History
  addTurn(turn: Omit<DialogTurn, 'timestamp'>): void {
    this.history.push({
      ...turn,
      timestamp: Date.now()
    });

    // Ограничить историю последними 20 сообщениями
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }
  }

  getHistory(): DialogTurn[] {
    return [...this.history];
  }

  clearHistory(): void {
    this.history = [];
  }

  // Full reset
  reset(): void {
    this.history = [];
    this.activeIntent = null;
  }
}