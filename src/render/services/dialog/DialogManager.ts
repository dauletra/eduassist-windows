import type { CLUResponse } from '../CLUService';
import { DialogState } from './DialogState';
import { IntentRegistry } from './IntentRegistry';
import { SlotFiller } from './SlotFiller';
import { voiceAdapter } from '../commands/adapters/VoiceAdapter';
import type { DialogContext } from '../commands';

export interface DialogResult {
  success: boolean;
  message: string;
  needsClarification?: boolean;
  clarificationQuestion?: string;
  data?: any;
}

export class DialogManager {
  private state: DialogState;
  private registry: IntentRegistry;
  private slotFiller: SlotFiller;

  constructor() {
    this.state = new DialogState();
    this.registry = new IntentRegistry();
    this.slotFiller = new SlotFiller();
  }

  /**
   * Обработать команду пользователя
   *
   * @param cluResponse - ответ от CLU с интентом и сущностями
   * @param userText - оригинальный текст команды
   * @param context - текущий контекст из React Context (единственный источник правды)
   */
  async process(
    cluResponse: CLUResponse,
    userText: string,
    context: DialogContext
  ): Promise<DialogResult> {
    console.group('🎯 DialogManager.process()');
    console.log('User:', userText);
    console.log('Intent:', cluResponse.topIntent);
    console.log('Entities:', cluResponse.entities);
    console.log('Context:', context);

    // Добавить в историю
    this.state.addTurn({
      type: 'user',
      text: userText,
      intent: cluResponse.topIntent,
      entities: cluResponse.entities
    });

    const intentName = cluResponse.topIntent;

    // Проверить, есть ли такой intent
    const intentDef = this.registry.get(intentName);
    if (!intentDef) {
      console.log('❌ Unknown intent:', intentName);
      console.groupEnd();
      return {
        success: false,
        message: `Команда "${intentName}" не поддерживается`
      };
    }

    // Проверить, требуется ли контекст
    const hasContext = !!(context.classId && context.groupId);

    console.log('🔍 Context check:', {
      requiresContext: intentDef.requiresContext,
      hasContext,
      context
    });

    if (intentDef.requiresContext && !hasContext) {
      console.log('⚠️ Context required but not available');

      // Если это OpenJournal, продолжить обработку
      if (intentName !== 'OpenJournal') {
        console.groupEnd();
        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: 'Сначала откройте журнал',
          message: 'Необходимо открыть журнал'
        };
      }
    }

    // Получить или создать active intent
    const activeIntent = this.state.getActiveIntent();
    const isSameIntent = activeIntent && activeIntent.name === intentName;

    const currentSlots = isSameIntent ? activeIntent!.slots : {};

    // Заполнить слоты (передаём контекст для валидации)
    const { slots, missingSlots, validationErrors } = this.slotFiller.fillSlots(
      intentDef,
      cluResponse,
      currentSlots,
      context // Используем переданный контекст
    );

    // Проверить ошибки валидации
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.entries(validationErrors)
        .map(([slot, error]) => `${slot}: ${error}`)
        .join(', ');

      console.log('❌ Validation errors:', validationErrors);
      console.groupEnd();

      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: errorMessages,
        message: 'Ошибка валидации'
      };
    }

    // Если есть недостающие слоты, сохранить intent и запросить данные
    if (missingSlots.length > 0) {
      console.log('❓ Missing slots:', missingSlots.map(s => s.name));

      // Сохранить активный intent
      if (!isSameIntent) {
        this.state.setActiveIntent(intentName, slots);
      } else {
        this.state.updateSlots(slots);
      }

      const prompt = this.slotFiller.getNextPrompt(missingSlots);

      console.groupEnd();
      return {
        success: false,
        needsClarification: true,
        clarificationQuestion: prompt || 'Уточните данные',
        message: 'Недостаточно данных'
      };
    }

    // Все слоты заполнены, выполнить действие через VoiceAdapter
    console.log('✅ All slots filled, executing command via VoiceAdapter...');
    console.log('Slots:', slots);

    try {
      // Выполнить команду через VoiceAdapter
      const result = await voiceAdapter.executeVoiceCommand(
        intentName,
        slots,
        context, // Передаём актуальный контекст
        context.currentLesson
      );

      // Очистить активный intent
      this.state.clearActiveIntent();

      // Добавить ответ в историю
      this.state.addTurn({
        type: 'assistant',
        text: result.message
      });

      console.log('✅ Command executed successfully via VoiceAdapter');
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

  // Публичные методы для управления состоянием
  getHistory() {
    return this.state.getHistory();
  }

  reset() {
    this.state.reset();
  }
}