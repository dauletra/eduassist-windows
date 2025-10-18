import type {Student} from "../../../electron/shared-types.ts";

export interface CommandContext {
  classNumber?: string;
  classLetter?: string;
  groupNumber?: string;
  students?: Student[];
  files?: string[];
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
  private context: CommandContext = {};
  private history: DialogTurn[] = [];
  private activeIntent: ActiveIntent | null = null;
  private readonly INTENT_TIMEOUT = 30000; // 30 сек

  // Context
  setContext(update: Partial<CommandContext>): void {
    this.context = { ...this.context, ...update };
  }

  getContext(): CommandContext {
    return { ...this.context };
  }

  hasContext(): boolean {
    return !!(this.context.classNumber && this.context.classLetter);
  }

  resetContext(): void {
    this.context = {};
  }

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
    this.context = {};
    this.history = [];
    this.activeIntent = null;
  }
}