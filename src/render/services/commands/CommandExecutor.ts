// src/render/services/commands/CommandExecutor.ts

import { commandHandler } from './CommandHandler';
import { commandEventBus } from '../CommandEventBus';
import type { DialogContext } from './types';
import type { EnrichedLesson } from '../../types';
import type { Command, CommandResult, CommandSource } from './types';
import type { EventProcessor } from './EventProcessor';

/**
 * Унифицированный executor для выполнения команд из любого источника
 *
 * Все адаптеры (UI, Voice, Hotkey) используют этот класс
 * Различие только в поле source
 */
export class CommandExecutor {
  private getContext: () => DialogContext;
  private getCurrentLesson: () => EnrichedLesson | null;
  private eventProcessor: EventProcessor;

  constructor(
    getContext: () => DialogContext,
    getCurrentLesson: () => EnrichedLesson | null,
    eventProcessor: EventProcessor
  ) {
    this.getContext = getContext;
    this.getCurrentLesson = getCurrentLesson;
    this.eventProcessor = eventProcessor;
  }

  /**
   * Выполнить команду
   *
   * @param type - тип команды ('SetGrade', 'RandomStudent' и т.д.)
   * @param params - параметры команды
   * @param source - источник команды ('ui', 'voice', 'system')
   */
  async execute(
    type: string,
    params: Record<string, any>,
    source: CommandSource
  ): Promise<CommandResult> {
    console.group(`🎯 CommandExecutor.execute() [${source}]`);
    console.log('Command:', type);
    console.log('Params:', params);
    console.log('Source:', source);

    try {
      // Получить актуальный контекст
      const context = this.getContext();
      const currentLesson = this.getCurrentLesson();

      console.log('Context:', context);

      const command: Command = {
        type,
        params,
        source
      };

      // Выполнить команду через CommandHandler
      const result = await commandHandler.execute(command, context, currentLesson);

      // Обработать события команды через EventProcessor
      if (result.events && result.events.length > 0) {
        console.log('🔄 Processing events:', result.events);
        this.eventProcessor.processEvents(result.events);

        // Публикуем события через EventBus для других подписчиков
        result.events.forEach(event => {
          console.log('📢 Publishing event:', event.type);
          commandEventBus.emit(event.type, event.payload);
        });
      }

      // Если успешно и есть данные, опубликовать событие (legacy)
      if (result.success && result.data) {
        console.log('📢 Publishing legacy event:', result.data.type);
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

// Singleton удалён - экземпляр создаётся в React Context
// export const commandExecutor = new CommandExecutor();