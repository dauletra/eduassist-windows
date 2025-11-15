// src/render/services/dialog/VoiceCommandProcessor.ts

import type { CLUResponse } from '../CLUService';
import { DialogState } from './DialogState';
// import { SlotFiller } from './SlotFiller';
// import type { DialogContext } from '../commands';
import type { CommandDispatcher } from '../commands';
import {AppStore} from "../../store";
import {SlotFiller} from "./SlotFiller.ts"; // ИЗМЕНЕНО

export interface DialogResult {
  success: boolean;
  message: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  data?: any;
}

export class VoiceCommandProcessor {
  private store: AppStore;
  private state: DialogState;
  private slotFiller: SlotFiller;
  private commandDispatcher: CommandDispatcher; // ИЗМЕНЕНО

  constructor(commandDispatcher: CommandDispatcher, store: AppStore) { // ИЗМЕНЕНО
    this.state = new DialogState();
    this.commandDispatcher = commandDispatcher;
    this.store = store;
    this.slotFiller = new SlotFiller(store);
  }

  async process(
    cluResponse: CLUResponse,
    userText: string,
  ): Promise<DialogResult> {
    const context = this.store.getDialogContext()
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

    // Упрощенная обработка - напрямую выполняем команду
    try {
      console.log('✅ Executing command via CommandDispatcher...');

      // Преобразуем entities в параметры
      const params = this.slotFiller.fillSlotsFromCLU(cluResponse, context);
      console.log('Normalized params:', params);

      // Валидация параметров
      const validation = this.slotFiller.validateParams(intentName, params, context);
      if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.message);
        this.state.setActiveIntent(intentName, params);
        console.groupEnd();
        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: validation.message,
          message: validation.message || 'Недостаточно параметров'
        };
      }

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