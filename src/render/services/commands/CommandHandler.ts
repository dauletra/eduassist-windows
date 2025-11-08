import type { EnrichedLesson } from '../../types';
import type { CommandContext } from '../dialog/DialogState';
import type {
  Command,
  CommandResult,
  CommandDefinition
} from './types';
import {
  CommandValidationError,
  CommandExecutionError
} from './types';

/**
 * Центральный обработчик команд
 * Единая точка входа для всех команд из любых источников (голос, UI, горячие клавиши)
 */
export class CommandHandler {
  private commands: Map<string, CommandDefinition> = new Map();
  private executionHistory: Array<{ command: Command; result: CommandResult; timestamp: Date }> = [];
  private maxHistorySize = 100;

  /**
   * Зарегистрировать команду
   */
  register(definition: CommandDefinition): void {
    if (this.commands.has(definition.type)) {
      console.warn(`⚠️ Command ${definition.type} is already registered, overwriting`);
    }

    this.commands.set(definition.type, definition);
    console.log(`✅ Command registered: ${definition.type} (${definition.displayName})`);
  }

  /**
   * Зарегистрировать несколько команд
   */
  registerMany(definitions: CommandDefinition[]): void {
    definitions.forEach(def => this.register(def));
  }

  /**
   * Получить определение команды
   */
  getDefinition(type: string): CommandDefinition | undefined {
    return this.commands.get(type);
  }

  /**
   * Получить все зарегистрированные команды
   */
  getAllDefinitions(): CommandDefinition[] {
    return Array.from(this.commands.values());
  }

  /**
   * Проверить, зарегистрирована ли команда
   */
  has(type: string): boolean {
    return this.commands.has(type);
  }

  /**
   * Выполнить команду
   *
   * @param command - объект команды
   * @param context - текущий контекст (открытый журнал и т.д.)
   * @param currentLesson - текущий урок
   */
  async execute(
    command: Command,
    context: CommandContext,
    currentLesson: EnrichedLesson | null
  ): Promise<CommandResult> {
    console.group(`🎯 CommandHandler.execute()`);
    console.log('Command:', command.type);
    console.log('Source:', command.source);
    console.log('Params:', command.params);
    console.log('Context:', context);
    console.log('Current Lesson:', currentLesson?.id);

    try {
      // 1. Проверить, существует ли команда
      const definition = this.commands.get(command.type);
      if (!definition) {
        console.error(`❌ Unknown command: ${command.type}`);
        console.groupEnd();

        return {
          success: false,
          message: `Команда "${command.type}" не зарегистрирована`
        };
      }

      // 2. Проверить контекст
      if (definition.requiresContext && !context.groupId) {
        console.warn('⚠️ Command requires context but context is not available');
        console.groupEnd();

        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: 'Сначала откройте журнал',
          message: 'Необходимо открыть журнал'
        };
      }

      // 3. Валидировать параметры
      const validationResult = this.validateParams(
        definition,
        command.params,
        context,
        currentLesson
      );

      if (!validationResult.valid) {
        console.error('❌ Validation failed:', validationResult.errors);
        console.groupEnd();

        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: Object.entries(validationResult.errors)
            .map(([param, error]) => `${param}: ${error}`)
            .join(', '),
          message: 'Ошибка валидации параметров'
        };
      }

      // 4. Трансформировать параметры
      const transformedParams = this.transformParams(definition, command.params);

      // 5. Выполнить команду
      console.log('✅ All checks passed, executing command...');
      const result = await definition.execute(
        transformedParams,
        context,
        currentLesson
      );

      // 6. Сохранить в историю
      this.addToHistory(command, result);

      console.log('✅ Command executed successfully');
      console.log('Result:', result);
      console.groupEnd();

      return result;

    } catch (error) {
      console.error('❌ Command execution failed:', error);
      console.groupEnd();

      if (error instanceof CommandValidationError) {
        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: error.validationMessage,
          message: 'Ошибка валидации'
        };
      }

      if (error instanceof CommandExecutionError) {
        return {
          success: false,
          message: error.message
        };
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Валидировать параметры команды
   */
  private validateParams(
    definition: CommandDefinition,
    params: Record<string, any>,
    context: CommandContext,
    currentLesson: EnrichedLesson | null
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const paramDef of definition.params) {
      const value = params[paramDef.name];

      // Проверить обязательные параметры
      if (paramDef.required && (value === undefined || value === null)) {
        errors[paramDef.name] = 'Обязательный параметр отсутствует';
        continue;
      }

      // Пропустить необязательные пустые параметры
      if (!paramDef.required && (value === undefined || value === null)) {
        continue;
      }

      // Кастомная валидация
      if (paramDef.validate) {
        const validationResult = paramDef.validate(value, context, currentLesson);

        if (validationResult !== true) {
          errors[paramDef.name] = typeof validationResult === 'string'
            ? validationResult
            : 'Невалидное значение';
        }
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Трансформировать параметры команды
   */
  private transformParams(
    definition: CommandDefinition,
    params: Record<string, any>
  ): Record<string, any> {
    const transformed: Record<string, any> = { ...params };

    for (const paramDef of definition.params) {
      const value = params[paramDef.name];

      // Применить значение по умолчанию
      if ((value === undefined || value === null) && paramDef.default !== undefined) {
        transformed[paramDef.name] = paramDef.default;
        continue;
      }

      // Применить трансформацию
      if (value !== undefined && value !== null && paramDef.transform) {
        transformed[paramDef.name] = paramDef.transform(value);
      }
    }

    return transformed;
  }

  /**
   * Добавить команду в историю
   */
  private addToHistory(command: Command, result: CommandResult): void {
    this.executionHistory.push({
      command,
      result,
      timestamp: new Date()
    });

    // Ограничить размер истории
    if (this.executionHistory.length > this.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * Получить историю выполнения команд
   */
  getHistory(limit?: number): Array<{ command: Command; result: CommandResult; timestamp: Date }> {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return [...this.executionHistory];
  }

  /**
   * Очистить историю
   */
  clearHistory(): void {
    this.executionHistory = [];
  }
}

// Singleton instance
export const commandHandler = new CommandHandler();