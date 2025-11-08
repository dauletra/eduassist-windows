// src/render/services/commands/CommandExecutor.ts

import { commandHandler } from './CommandHandler';
import { commandEventBus } from '../CommandEventBus';
import type { CommandContext } from '../dialog/DialogState';
import type { EnrichedLesson } from '../../types';
import type { Command, CommandResult, CommandSource } from './types';

/**
 * Унифицированный executor для выполнения команд из любого источника
 *
 * Все адаптеры (UI, Voice, Hotkey) используют этот класс
 * Различие только в поле source
 */
export class CommandExecutor {
  /**
   * Выполнить команду
   *
   * @param type - тип команды ('SetGrade', 'RandomStudent' и т.д.)
   * @param params - параметры команды
   * @param source - источник команды ('ui', 'voice', 'hotkey')
   * @param context - текущий контекст
   * @param currentLesson - текущий урок
   */
  async execute(
    type: string,
    params: Record<string, any>,
    source: CommandSource,
    context: CommandContext,
    currentLesson: EnrichedLesson | null
  ): Promise<CommandResult> {
    console.group(`🎯 CommandExecutor.execute() [${source}]`);
    console.log('Command:', type);
    console.log('Params:', params);
    console.log('Source:', source);

    try {
      const command: Command = {
        type,
        params,
        source
      };

      // Выполнить команду через CommandHandler
      const result = await commandHandler.execute(command, context, currentLesson);

      // Если успешно и есть данные, опубликовать событие
      if (result.success && result.data) {
        console.log('📢 Publishing event:', result.data.type);
        commandEventBus.emit(result.data.type, result.data);
      }

      console.log(`✅ Command executed from ${source}:`, result);
      console.groupEnd();

      return result;

    } catch (error) {
      console.error(`❌ Command execution failed from ${source}:`, error);
      console.groupEnd();

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }
}

// Singleton instance
export const commandExecutor = new CommandExecutor();