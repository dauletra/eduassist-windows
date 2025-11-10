// src/render/services/dialog/SlotFiller.ts

import type { CLUResponse } from '../CLUService';
// import type { FinalCommandDispatcher } from '../commands/FinalCommandDispatcher'; // ИЗМЕНЕНО
import type { DialogContext } from '../commands';

// Временно упрощаем SlotFiller - можно полностью переписать позже
export class SlotFiller {
  /**
   * Упрощенный метод заполнения слотов
   * TODO: Полностью переписать для новой системы
   */
  fillSlotsFromCLU(cluResponse: CLUResponse): Record<string, any> {
    const params: Record<string, any> = {};

    cluResponse.entities.forEach(entity => {
      const extraInfo = entity.extraInformation as any;
      const value = extraInfo?.listKey ?? entity.text;
      params[entity.category] = value;
    });

    return params;
  }

  /**
   * Проверить, достаточно ли параметров для команды
   */
  validateParams(commandType: string, _params: Record<string, any>, context: DialogContext): {
    isValid: boolean;
    missingParams?: string[];
    message?: string;
  } {
    // Базовая валидация - можно расширить позже
    if (commandType !== 'OpenJournal' && !context.classId) {
      return {
        isValid: false,
        message: 'Сначала откройте журнал'
      };
    }

    return { isValid: true };
  }
}