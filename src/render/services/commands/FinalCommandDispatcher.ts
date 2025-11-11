// src/render/services/commands/FinalCommandDispatcher.ts

import type { CommandResult } from './types';
import type { AppStore } from '../../store';
import { NewCommandDispatcher } from './NewCommandDispatcher';
import { allNewCommands } from './newCommands';

/**
 * Финальный диспетчер команд - только новая система
 */
export class FinalCommandDispatcher {
  private store: AppStore;
  private newDispatcher: NewCommandDispatcher;

  constructor(store: AppStore) {
    this.store = store;
    this.newDispatcher = new NewCommandDispatcher(store);

    // Регистрируем ВСЕ команды новой системы
    this.newDispatcher.registerMany(allNewCommands);

    console.log('✅ FinalCommandDispatcher initialized');
    console.log('Available commands:', this.newDispatcher.getAllCommands());
  }

  /**
   * Главный метод выполнения команд
   */
  async execute(
    commandType: string,
    params: Record<string, any>,
    source: 'voice' | 'ui' | 'system' = 'ui'
  ): Promise<CommandResult> {
    console.group(`🎯 FinalCommandDispatcher.execute() [${source}]`);
    console.log('Command:', commandType);
    console.log('Params:', params);
    console.log('Source:', source);

    const normalizedParams = this.normalizeParams(params);
    console.log('Normalized params:', normalizedParams);

    try {
      if (!this.newDispatcher.hasCommand(commandType)) {
        console.error(`❌ Command not found: ${commandType}`);
        console.groupEnd();
        return {
          success: false,
          message: `Команда "${commandType}" не найдена`
        };
      }

      const result = await this.newDispatcher.execute(commandType, normalizedParams, source);
      console.log(`✅ Command executed:`, result);
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
   * Нормализует параметры для единообразия
   */
  private normalizeParams(params: Record<string, any>): Record<string, any> {
    const normalized: Record<string, any> = { ...params };

    // Приводим к единому формату имен параметров
    if (params.ClassNumber !== undefined) normalized.classNumber = params.ClassNumber;
    if (params.ClassLetter !== undefined) normalized.classLetter = this.normalizeClassLetter(params.ClassLetter);
    if (params.GroupNumber !== undefined) normalized.groupNumber = this.normalizeGroupNumber(params.GroupNumber);
    if (params.NumberValue !== undefined && !normalized.groupNumber) {
      normalized.groupNumber = this.normalizeGroupNumber(params.NumberValue);
    }

    // Нормализуем числовые параметры
    if (params.NumberValue !== undefined) {
      normalized.numberValue = params.NumberValue;
    }
    if (params.groupNumber !== undefined) {
      normalized.numberValue = normalized.numberValue || params.groupNumber;
    }

    // Очищаем строковые числовые значения
    if (typeof normalized.numberValue === 'string') {
      // Убираем точку в конце, если есть
      normalized.numberValue = normalized.numberValue.replace(/\.$/, '');
    }

    return normalized;
  }

  /**
   * Нормализует букву класса
   */
  private normalizeClassLetter(letter: string): string {
    if (!letter) return '';

    // Убираем слова "класса", "класс" и оставляем только букву
    const cleaned = letter
      .replace(/класса?/gi, '')
      .replace(/\s+/g, '')
      .trim()
      .toLowerCase();

    return cleaned || letter.trim().toLowerCase();
  }

  /**
   * Нормализует номер группы
   */
  private normalizeGroupNumber(groupNumber: string): string {
    if (!groupNumber) return '';

    // Убираем слова "группы", "группа" и оставляем только цифру
    const cleaned = groupNumber
      .replace(/группы?/gi, '')
      .replace(/\s+/g, '')
      .trim();

    return cleaned || groupNumber.trim();
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

  /**
   * Проверить, доступна ли команда
   */
  hasCommand(commandType: string): boolean {
    return this.newDispatcher.hasCommand(commandType);
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
    return this.newDispatcher.getAllCommands();
  }
}