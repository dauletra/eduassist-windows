// import type { IntentDefinition, SlotDefinition, ActionResult } from './types';
import type { IntentDefinition, ActionResult } from './types';
import type { CommandContext } from '../DialogState';

export const openJournalIntent: IntentDefinition = {
  name: 'OpenJournal',
  displayName: 'Открыть журнал',
  requiresContext: false,

  slots: [
    {
      name: 'classNumber',
      required: true,
      type: 'string',
      entityCategory: 'ClassNumber',
      prompt: 'Какой класс открыть? Например: 9',
      validate: (value) => {
        const num = parseInt(value);
        if (isNaN(num) || num < 7 || num > 11) {
          return 'Класс должен быть от 7 до 11';
        }
        return true;
      }
    },
    {
      name: 'classLetter',
      required: true,
      type: 'string',
      entityCategory: 'ClassLetter',
      prompt: 'Какую букву класса? Например: МР или А',
      transform: (value) => {
        // Нормализация: убрать " класса", " КЛАССА", "-класса" и т.д.
        const normalized = String(value)
          .toUpperCase()
          .replace(/[-\s]?КЛАССА?/gi, '')
          .trim();

        return normalized;
      },
      validate: (value) => {
        const validLetters = ['А', 'Ә', 'Б', 'В', 'Г', 'Д', 'МР'];
        const normalized = String(value).toUpperCase().replace(/[-\s]?КЛАССА?/gi, '').trim();

        if (!validLetters.includes(normalized)) {
          return `Буква класса должна быть одной из: ${validLetters.join(', ')}`;
        }

        return true;
      }
    },
    {
      name: 'groupNumber',
      required: false,
      type: 'string',
      entityCategory: 'GroupNumber',
      prompt: 'Какую группу открыть? Первую или вторую?',
      transform: (value) => {
        // Нормализация: "1", "первая", "первую" -> "1"
        if (/^(1|первая|первую|первой)$/i.test(value)) return '1';
        if (/^(2|вторая|вторую|второй)$/i.test(value)) return '2';
        return value;
      },
      autoFill: () => '1' // По умолчанию первая группа
    }
  ],

  action: async (slots, context: CommandContext): Promise<ActionResult> => {
    const classId = `${slots.classNumber}${slots.classLetter}`;
    const groupId = `${classId} ${slots.groupNumber} группа`;

    console.log('✅ Journal opened:', groupId, typeof context);

    return {
      success: true,
      message: `Журнал ${groupId} открыт`,
      data: {
        type: 'journal_opened',
        classNumber: slots.classNumber,
        classLetter: slots.classLetter,
        groupNumber: slots.groupNumber
      },
      updateContext: {
        classNumber: slots.classNumber,
        classLetter: slots.classLetter,
        groupNumber: slots.groupNumber,
        students: [] // Будет заполнено реальными студентами из App.tsx
      }
    };
  }
};