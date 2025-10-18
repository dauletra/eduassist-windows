import type { IntentDefinition, ActionResult } from './types';
// import type { CommandContext } from '../DialogState';
import type { Student } from '../../../../electron/shared-types';

// Утилита для перемешивания массива
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Intent: Разделить на N групп
export const divideByGroupCountIntent: IntentDefinition = {
  name: 'DivideByGroupCount',
  displayName: 'Разделить на N групп',
  requiresContext: true,

  slots: [
    {
      name: 'numberValue',
      required: true,
      type: 'number',
      entityCategory: 'NumberValue',
      prompt: 'На сколько групп разделить учеников?',
      validate: (value, context) => {
        const count = Number(value);
        const maxCount = context.students?.length || 0;

        if (!Number.isInteger(count)) {
          return 'Количество групп должно быть целым числом';
        }
        if (count < 2) {
          return 'Минимум 2 группы';
        }
        if (count > maxCount) {
          return `Максимум ${maxCount} групп (по количеству учеников)`;
        }

        return true;
      },
      transform: (value) => {
        const numberWords: Record<string, number> = {
          'два': 2, 'две': 2, 'двое': 2,
          'три': 3, 'трое': 3,
          'четыре': 4, 'пять': 5, 'шесть': 6,
          'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10
        };

        const normalized = String(value).toLowerCase().trim();
        return numberWords[normalized] ?? Number(value);
      }
    }
  ],

  action: async (slots, context): Promise<ActionResult> => {
    const students = context.students || [];
    const groupCount = Number(slots.numberValue);

    if (students.length === 0) {
      return {
        success: false,
        message: 'Список учеников пуст'
      };
    }

    // Перемешать учеников
    const shuffled = shuffleArray(students);

    // Создать пустые группы
    const groups: Student[][] = Array.from({ length: groupCount }, () => []);

    // Распределить учеников по группам равномерно
    shuffled.forEach((student, idx) => {
      groups[idx % groupCount].push(student);
    });

    // Сформировать текстовое сообщение
    // Краткое сообщение
    const message = `Ученики разделены на ${groupCount} ${groupCount === 2 ? 'группы' : groupCount === 3 || groupCount === 4 ? 'группы' : 'групп'}`;

    console.log('👥 Groups formed by count:', groups);

    return {
      success: true,
      message: message.trim(),
      data: {
        type: 'groups_formed',
        method: 'by_count',
        groupCount
      }
    };
  }
};

// Intent: Разделить по N человек в группе
export const divideByGroupSizeIntent: IntentDefinition = {
  name: 'DivideByGroupSize',
  displayName: 'Разделить по N человек',
  requiresContext: true,

  slots: [
    {
      name: 'numberValue',
      required: true,
      type: 'number',
      entityCategory: 'NumberValue',
      prompt: 'По сколько учеников должно быть в каждой группе?',
      validate: (value, context) => {
        const size = Number(value);
        const maxSize = context.students?.length || 0;

        if (!Number.isInteger(size)) {
          return 'Размер группы должен быть целым числом';
        }
        if (size < 1) {
          return 'Минимум 1 ученик в группе';
        }
        if (size > maxSize) {
          return `Максимум ${maxSize} учеников (всего в списке)`;
        }

        return true;
      },
      transform: (value) => {
        // Обработка слова "пары" -> 2
        const normalized = String(value).toLowerCase().trim();
        if (/^пар[аыуе]?$/i.test(normalized)) {
          return 2;
        }

        const numberWords: Record<string, number> = {
          'два': 2, 'две': 2, 'двое': 2,
          'три': 3, 'трое': 3,
          'четыре': 4, 'пять': 5, 'шесть': 6,
          'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10
        };

        return numberWords[normalized] ?? Number(value);
      }
    }
  ],

  action: async (slots, context): Promise<ActionResult> => {
    const students = context.students || [];
    const groupSize = Number(slots.numberValue);

    if (students.length === 0) {
      return {
        success: false,
        message: 'Список учеников пуст'
      };
    }

    // Перемешать учеников
    const shuffled = shuffleArray(students);

    // Разделить на группы
    const groups: Student[][] = [];
    for (let i = 0; i < shuffled.length; i += groupSize) {
      groups.push(shuffled.slice(i, i + groupSize));
    }

    // Краткое сообщение
    const groupsCount = groups.length;
    const message = `Ученики разделены по ${groupSize} ${groupSize === 1 ? 'ученику' : groupSize < 5 ? 'ученика' : 'учеников'}. Получилось ${groupsCount} ${groupsCount === 1 ? 'группа' : groupsCount < 5 ? 'группы' : 'групп'}`;

    console.log('👥 Groups formed by size:', groups);

    return {
      success: true,
      message: message.trim(),
      data: {
        type: 'groups_formed',
        method: 'by_size',
        groupSize
      }
    };
  }
};