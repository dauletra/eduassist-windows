// import type { CLUResponse } from '../CLUService';
import type { CommandContext } from '../DialogState';

// Определение слота
export interface SlotDefinition {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'student' | 'file';
  entityCategory?: string; // CLU entity category
  prompt: string;
  validate?: (value: any, context: CommandContext) => boolean | string;
  transform?: (value: any) => any;
  autoFill?: (context: CommandContext) => any; // Автозаполнение из контекста
}

// Результат выполнения действия
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any; // Результат для UI (группы, выбранный ученик и т.д.)
  updateContext?: Partial<CommandContext>; // Обновления контекста
}

// Декларативное описание Intent
export interface IntentDefinition {
  name: string;
  displayName: string;
  requiresContext: boolean; // Нужен ли открытый журнал
  slots: SlotDefinition[];
  action: (slots: Record<string, any>, context: CommandContext) => Promise<ActionResult>;
}