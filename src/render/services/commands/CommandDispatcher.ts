// src/render/services/commands/CommandDispatcher.ts

import type { CommandResult } from './types';
import type { AppStore } from '../../store';
import { allNewCommands } from './newCommands';
import { voiceCommandBus } from '../VoiceCommandBus';

/**
 * Интерфейс команды
 */
export interface Command {
  type: string;
  execute(store: AppStore, params: Record<string, any>): Promise<CommandResult>;
}

/**
 * Результат выполнения команды с опциональным обновлением состояния
 */
export interface CommandResultWithState extends CommandResult {
  newState?: Partial<ReturnType<AppStore['getState']>>;
}

/**
 * Диспетчер команд - единая точка выполнения всех команд приложения
 *
 * Функции:
 * - Регистрация команд
  * - Выполнение команд с указанием источника (voice/ui/system)
 * - Управление состоянием через Store
 */
export class CommandDispatcher {
  private commands = new Map<string, Command>();
  private store: AppStore;

  constructor(store: AppStore) {
    this.store = store;

    // Регистрируем все команды
    this.registerMany(allNewCommands);

    console.log('✅ CommandDispatcher initialized');
    console.log('Available commands:', this.getAllCommands());
  }

  // ========================================
  // Регистрация команд
  // ========================================

  /**
   * Зарегистрировать команду
   */
  register(command: Command): void {
    if (this.commands.has(command.type)) {
      console.warn(`⚠️ Command ${command.type} is already registered, overwriting`);
    }

    this.commands.set(command.type, command);
    console.log(`✅ Command registered: ${command.type}`);
  }

  /**
   * Зарегистрировать несколько команд
   */
  registerMany(commands: Command[]): void {
    commands.forEach(command => this.register(command));
  }

  // ========================================
  // Выполнение команд
  // ========================================

  /**
   * Главный метод выполнения команд
   */
  async execute(
    commandType: string,
    params: Record<string, any>,
    source: 'voice' | 'ui' | 'system' = 'ui'
  ): Promise<CommandResult> {
    console.group(`🎯 CommandDispatcher.execute() [${source}]`);
    console.log('Command:', commandType);
    console.log('Params:', params);
    console.log('Source:', source);

    // Выполнение команды
    const command = this.commands.get(commandType);
    if (!command) {
      console.error(`❌ Command not found: ${commandType}`);
      console.groupEnd();

      // ✅ ДОБАВЛЕНО: Публикуем событие ошибки
      if (source === 'voice') {
        voiceCommandBus.publish('command-failed', {
          commandType,
          error: `Ондай команда табылмады: "${commandType}" `
        });
      }

      return {
        success: false,
        message: `Команда "${commandType}" не найдена`
      };
    }

    // Выполнение команды
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

      // ✅ ДОБАВЛЕНО: Публикуем событие успешного выполнения
      if (source === 'voice') {
        voiceCommandBus.publish('command-executed', {
          commandType,
          params,
          result
        });
      }

      return result;

    } catch (error) {
      console.error(`❌ Command execution failed:`, error);
      console.groupEnd();

      if (source === 'voice') {
        voiceCommandBus.publish('command-failed', {
          commandType,
          params,
          error: error instanceof Error ? error.message : 'Түсініксіз қате кетті'
        });
      }

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  /**
   * Выполнить команду из голосового интерфейса
   */
  async executeFromVoice(
    commandType: string,
    params: Record<string, any>
  ): Promise<CommandResult> {
    return this.execute(commandType, params, 'voice');
  }

  /**
   * Выполнить команду из UI
   */
  async executeFromUI(
    commandType: string,
    params: Record<string, any>
  ): Promise<CommandResult> {
    return this.execute(commandType, params, 'ui');
  }

  /**
   * Выполнить команду из системы/хоткея
   */
  async executeFromSystem(
    commandType: string,
    params: Record<string, any> = {}
  ): Promise<CommandResult> {
    return this.execute(commandType, params, 'system');
  }

  // ========================================
  // Утилиты
  // ========================================

  /**
   * Проверить, доступна ли команда
   */
  hasCommand(commandType: string): boolean {
    return this.commands.has(commandType);
  }

  /**
   * Получить Store
   */
  getStore(): AppStore {
    return this.store;
  }

  /**
   * Получить список всех доступных команд
   */
  getAllCommands(): string[] {
    return Array.from(this.commands.keys());
  }
}