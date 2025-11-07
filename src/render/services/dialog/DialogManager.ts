import type { CLUResponse } from '../CLUService';
import type { EnrichedLesson } from '../../types';
import { DialogState } from './DialogState';
import { IntentRegistry } from './IntentRegistry';
import { SlotFiller } from './SlotFiller';
// import type { ActionResult } from './intents/types';

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
   * @param currentLesson - текущий урок (для доступа к актуальным данным)
   */
  async process(cluResponse: CLUResponse, userText: string, currentLesson: EnrichedLesson | null): Promise<DialogResult> {
    console.group('🎯 DialogManager.process()');
    console.log('User:', userText);
    console.log('Intent:', cluResponse.topIntent);
    console.log('Entities:', cluResponse.entities);
    console.log('Current Lesson:', currentLesson);

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
    console.log('🔍 Context check:', {
      requiresContext: intentDef.requiresContext,
      hasContext: this.state.hasContext(),
      currentContext: this.state.getContext(),
      hasLesson: !!currentLesson
    });

    if (intentDef.requiresContext && !this.state.hasContext()) {
      console.log('⚠️ Context required but not available');

      // Если это OpenJournal, продолжить обработку
      if (intentName !== 'OpenJournal') {
        console.groupEnd();
        return {
          success: false,
          needsClarification: true,
          clarificationQuestion: 'Сначала откройте журнал. Скажите: "Открой журнал 9 В класс первой группы"',
          message: 'Необходимо открыть журнал'
        };
      }
    }

    // Получить или создать active intent
    const activeIntent = this.state.getActiveIntent();
    const isSameIntent = activeIntent && activeIntent.name === intentName;

    const currentSlots = isSameIntent ? activeIntent!.slots : {};

    // Заполнить слоты
    const { slots, missingSlots, validationErrors } = this.slotFiller.fillSlots(
      intentDef,
      cluResponse,
      currentSlots,
      this.state.getContext()
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

    // Все слоты заполнены, выполнить действие
    console.log('✅ All slots filled, executing action...');
    console.log('Slots:', slots);

    try {
      const result = await intentDef.action(
        slots,
        this.state.getContext(),
        currentLesson
      );

      // Обновить контекст если нужно
      if (result.updateContext) {
        this.state.setContext(result.updateContext);
      }

      // Очистить активный intent
      this.state.clearActiveIntent();

      // Добавить ответ в историю
      this.state.addTurn({
        type: 'assistant',
        text: result.message
      });

      console.log('✅ Action executed successfully');
      console.groupEnd();

      return {
        success: result.success,
        message: result.message,
        data: result.data
      };

    } catch (error) {
      console.error('❌ Action execution failed:', error);
      console.groupEnd();

      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка выполнения команды'
      };
    }
  }

  // Публичные методы для управления состоянием
  getContext() {
    return this.state.getContext();
  }

  getHistory() {
    return this.state.getHistory();
  }

  reset() {
    this.state.reset();
  }
}