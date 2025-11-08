// import type { CLUResponse } from '../CLUService';
import type { DialogContext } from '../DialogManager.ts';
import type { EnrichedLesson } from '../../../types';

// Определение слота
export interface SlotDefinition {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'student' | 'file';
  entityCategory?: string; // CLU entity category
  prompt: string;
  validate?: (value: any, context: DialogContext, currentLesson: EnrichedLesson | null) => boolean | string;
  transform?: (value: any) => any;
  autoFill?: (context: DialogContext) => any; // Автозаполнение из контекста
}

// Результат выполнения действия
export interface ActionResult {
  success: boolean;
  message: string;
  data?: any; // Результат для UI (группы, выбранный ученик и т.д.)
  updateContext?: Partial<DialogContext>; // Обновления контекста
}

// Декларативное описание Intent
export interface IntentDefinition {
  name: string;
  displayName: string;
  requiresContext: boolean; // Нужен ли открытый журнал
  slots: SlotDefinition[];
  action: (
    slots: Record<string, any>,
    context: DialogContext,
    currentLesson: EnrichedLesson | null) => Promise<ActionResult>;
}
