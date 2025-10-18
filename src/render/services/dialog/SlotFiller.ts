import type { CLUResponse } from '../CLUService';
import type { IntentDefinition, SlotDefinition } from './intents/types';
import type { CommandContext } from './DialogState';

interface SlotFillerResult {
  slots: Record<string, any>;
  missingSlots: SlotDefinition[];
  validationErrors: Record<string, string>;
}

export class SlotFiller {
  // Маппинг CLU entity categories на slot names
  private readonly ENTITY_TO_SLOT: Record<string, string> = {
    'ClassNumber': 'classNumber',
    'ClassLetter': 'classLetter',
    'GroupNumber': 'groupNumber',
    'StudentName': 'studentName',
    'NumberValue': 'numberValue',
    'FileName': 'fileName',
    'Duration': 'duration'
  };

  /**
   * Заполнить слоты из CLU response и контекста
   */
  fillSlots(
    intentDef: IntentDefinition,
    cluResponse: CLUResponse,
    existingSlots: Record<string, any>,
    context: CommandContext
  ): SlotFillerResult {
    const slots: Record<string, any> = { ...existingSlots };
    const validationErrors: Record<string, string> = {};

    // 1. Извлечь entities из CLU
    const extractedEntities = this.extractEntities(cluResponse);

    // 2. Заполнить слоты из entities
    for (const slotDef of intentDef.slots) {
      // Пропустить уже заполненные слоты
      if (slots[slotDef.name] !== undefined) continue;

      // Попытка автозаполнения из контекста
      if (slotDef.autoFill) {
        const autoValue = slotDef.autoFill(context);
        if (autoValue !== undefined) {
          slots[slotDef.name] = autoValue;
          console.log(`🔄 Auto-filled slot '${slotDef.name}' from context:`, autoValue);
          continue;
        }
      }

      // Извлечь из entities
      const entityValue = this.findEntityValue(slotDef, extractedEntities);
      if (entityValue !== undefined) {
        // Transform если нужно
        const transformedValue = slotDef.transform
          ? slotDef.transform(entityValue)
          : entityValue;

        slots[slotDef.name] = transformedValue;
        console.log(`✅ Slot '${slotDef.name}' filled:`, transformedValue);
      }
    }

    // 3. Валидация заполненных слотов
    for (const slotDef of intentDef.slots) {
      if (slots[slotDef.name] !== undefined && slotDef.validate) {
        const validationResult = slotDef.validate(slots[slotDef.name], context);

        if (typeof validationResult === 'string') {
          validationErrors[slotDef.name] = validationResult;
          console.warn(`❌ Validation failed for '${slotDef.name}':`, validationResult);
        }
      }
    }

    // 4. Найти незаполненные required слоты
    const missingSlots = intentDef.slots.filter(
      slotDef => slotDef.required && slots[slotDef.name] === undefined
    );

    return { slots, missingSlots, validationErrors };
  }

  /**
   * Извлечь entities из CLU response в удобный формат
   */
  private extractEntities(cluResponse: CLUResponse): Record<string, any> {
    const entities: Record<string, any> = {};

    for (const entity of cluResponse.entities) {
      const slotName = this.ENTITY_TO_SLOT[entity.category] || entity.category.toLowerCase();
      entities[slotName] = entity.text;
    }

    return entities;
  }

  /**
   * Найти значение entity для слота
   */
  private findEntityValue(
    slotDef: SlotDefinition,
    extractedEntities: Record<string, any>
  ): any | undefined {
    // Сначала попробовать точное совпадение
    if (extractedEntities[slotDef.name] !== undefined) {
      return extractedEntities[slotDef.name];
    }

    // Попробовать через entityCategory
    if (slotDef.entityCategory) {
      const mappedSlotName = this.ENTITY_TO_SLOT[slotDef.entityCategory];
      if (mappedSlotName && extractedEntities[mappedSlotName] !== undefined) {
        return extractedEntities[mappedSlotName];
      }
    }

    return undefined;
  }

  /**
   * Получить следующий prompt для недостающего слота
   */
  getNextPrompt(missingSlots: SlotDefinition[]): string | null {
    if (missingSlots.length === 0) return null;
    return missingSlots[0].prompt;
  }
}