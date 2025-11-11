// src/render/services/dialog/VoiceCommandProcessor.ts

import type { CLUResponse } from '../CLUService';
import { DialogState } from './DialogState';
// import { SlotFiller } from './SlotFiller';
import type { DialogContext } from '../commands';
import type { FinalCommandDispatcher } from '../commands'; // ИЗМЕНЕНО

export interface DialogResult {
  success: boolean;
  message: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  data?: any;
}

export class VoiceCommandProcessor {
  private state: DialogState;
  // private slotFiller: SlotFiller;
  private commandDispatcher: FinalCommandDispatcher; // ИЗМЕНЕНО

  constructor(commandDispatcher: FinalCommandDispatcher) { // ИЗМЕНЕНО
    this.state = new DialogState();
    // this.slotFiller = new SlotFiller();
    this.commandDispatcher = commandDispatcher;
  }

  async process(
    cluResponse: CLUResponse,
    userText: string,
    context: DialogContext
  ): Promise<DialogResult> {
    console.group('🎯 VoiceCommandProcessor.process()');
    console.log('User:', userText);
    console.log('Intent:', cluResponse.topIntent);
    console.log('Entities:', cluResponse.entities);
    console.log('Context:', context);

    this.state.addTurn({
      type: 'user',
      text: userText,
      intent: cluResponse.topIntent,
      entities: cluResponse.entities
    });

    const intentName = cluResponse.topIntent;

    // Проверить, существует ли команда
    if (!this.commandDispatcher.hasCommand(intentName)) {
      console.log('❌ Unknown intent:', intentName);
      console.groupEnd();
      return {
        success: false,
        message: `Команда "${intentName}" не поддерживается`
      };
    }

    // Получить определение команды из SlotFiller (нужно обновить SlotFiller)
    // Временно используем базовую проверку контекста
    const hasContext = !!(context.classId && context.groupId);

    if (intentName !== 'OpenJournal' && !hasContext) {
      console.log('⚠️ Context required but not available');
      console.groupEnd();
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: 'Сначала откройте журнал',
        message: 'Необходимо открыть журнал'
      };
    }

    // Упрощенная обработка - напрямую выполняем команду
    // TODO: Обновить SlotFiller для работы с новой системой
    try {
      console.log('✅ Executing command via FinalCommandDispatcher...');

      // Преобразуем entities в параметры
      const params: Record<string, any> = {};
      cluResponse.entities.forEach(entity => {
        const extraInfo = entity.extraInformation as any;
        const value = extraInfo?.listKey ?? entity.text;
        params[entity.category] = value;
      });

      const result = await this.commandDispatcher.executeFromVoice(intentName, params);

      this.state.clearActiveIntent();

      this.state.addTurn({
        type: 'assistant',
        text: result.message
      });

      console.log('✅ Command executed successfully');
      console.groupEnd();

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        needsClarification: result.needsClarification,
        clarificationQuestion: result.clarificationQuestion
      };

    } catch (error) {
      console.error('❌ Command execution failed:', error);
      console.groupEnd();

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка выполнения команды'
      };
    }
  }

  getHistory() {
    return this.state.getHistory();
  }

  reset() {
    this.state.reset();
  }
}