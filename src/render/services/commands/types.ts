import type { EnrichedLesson } from '../../types';
import type { CommandContext } from '../dialog/DialogState';

/**
 * Источник команды
 */
export type CommandSource = 'voice' | 'ui' | 'system';

/**
 * Базовый интерфейс команды
 */
export interface Command {
  type: string; // 'SetGrade' | 'DivideStudents' | 'RandomStudent' и т.д.
  params: Record<string, any>; // параметры команды
  source: CommandSource; // откуда пришла команда
}

/**
 * Результат выполнения команды
 */
export interface CommandResult {
  success: boolean;
  message: string;
  data?: any; // данные для UI (группы, выбранный ученик и т.д.)
  needsClarification?: boolean; // нужно ли уточнение
  clarificationQuestion?: string; // вопрос для уточнения
  updateContext?: Partial<CommandContext>; // обновления контекста
}

/**
 * Определение параметра команды
 */
export interface CommandParamDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'student' | 'file' | 'array';
  entityCategory?: string;
  required: boolean;
  description?: string;
  validate?: (value: any, context: CommandContext, lesson: EnrichedLesson | null) => boolean | string;
  transform?: (value: any) => any;
  default?: any;
}

/**
 * Определение команды
 */
export interface CommandDefinition {
  type: string; // уникальный тип команды
  displayName: string; // человеко-читаемое название
  description?: string; // описание команды
  requiresContext: boolean; // требуется ли открытый журнал
  params: CommandParamDefinition[]; // параметры команды

  /**
   * Функция выполнения команды
   */
  execute: (
    params: Record<string, any>,
    context: CommandContext,
    currentLesson: EnrichedLesson | null
  ) => Promise<CommandResult>;
}

/**
 * Ошибка валидации команды
 */
export class CommandValidationError extends Error {
  public paramName: string;
  public validationMessage: string;

  constructor(paramName: string, validationMessage: string) {
    super(`Validation failed for ${paramName}: ${validationMessage}`);
    this.name = 'CommandValidationError';
    this.paramName = paramName;
    this.validationMessage = validationMessage;
  }
}

/**
 * Ошибка выполнения команды
 */
export class CommandExecutionError extends Error {
  public commandType: string;
  public originalError?: Error;

  constructor(commandType: string, message: string, originalError?: Error) {
    super(`Command ${commandType} execution failed: ${message}`);
    this.name = 'CommandExecutionError';
    this.commandType = commandType;
    this.originalError = originalError;
  }
}