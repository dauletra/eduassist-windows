// src/render/services/commands/NewCommandDispatcher.ts

import type { CommandResult } from './types';
import type { AppStore } from '../../store';

/**
 * Новая упрощенная система команд
 * Команды напрямую работают с Store
 */
export interface NewCommand {
  type: string;
  execute(store: AppStore, params: Record<string, any>): Promise<CommandResult>;
}

/**
 * Результат выполнения команды с новым состоянием
 */
export interface NewCommandResult extends CommandResult {
  newState?: Partial<AppStore['getState']>; // Опциональное обновление состояния
}

/**
 * Новый диспетчер команд с прямым доступом к Store
 */
export class NewCommandDispatcher {
  private commands = new Map<string, NewCommand>();
  private store: AppStore;

  constructor(store: AppStore) {
    this.store = store;
  }

  /**
   * Зарегистрировать команду
   */
  register(command: NewCommand): void {
    if (this.commands.has(command.type)) {
      console.warn(`⚠️ Command ${command.type} is already registered, overwriting`);
    }

    this.commands.set(command.type, command);
    console.log(`✅ New command registered: ${command.type}`);
  }

  /**
   * Зарегистрировать несколько команд
   */
  registerMany(commands: NewCommand[]): void {
    commands.forEach(command => this.register(command));
  }

  /**
   * Выполнить команду
   */
  async execute(
    commandType: string,
    params: Record<string, any>,
    source: 'voice' | 'ui' | 'system' = 'ui'
  ): Promise<CommandResult> {
    console.group(`🎯 NewCommandDispatcher.execute() [${source}]`);
    console.log('Command:', commandType);
    console.log('Params:', params);
    console.log('Source:', source);

    const command = this.commands.get(commandType);
    if (!command) {
      console.error(`❌ Command not found: ${commandType}`);
      console.groupEnd();
      return {
        success: false,
        message: `Команда "${commandType}" не найдена`
      };
    }

    try {
      const result = await command.execute(this.store, params);

      // Применить обновления состояния если они есть
      if (result.newState) {
        this.store.setState(prev => ({
          ...prev,
          ...result.newState
        }));
      }

      console.log(`✅ Command executed successfully:`, result);
      console.groupEnd();

      return result;

    } catch (error) {
      console.error(`❌ Command execution failed:`, error);
      console.groupEnd();

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Проверить, доступна ли команда
   */
  hasCommand(commandType: string): boolean {
    return this.commands.has(commandType);
  }

  /**
   * Получить все зарегистрированные команды
   */
  getAllCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}