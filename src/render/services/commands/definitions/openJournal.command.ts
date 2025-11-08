import type { CommandDefinition } from '../types';

/**
 * Команда открытия журнала класса
 *
 * Может быть вызвана:
 * - Голосом: "Открой журнал 9 В второй группы"
 * - UI: клик на группу в сайдбаре
 * - Горячие клавиши: Ctrl+1, Ctrl+2 и т.д.
 */
export const openJournalCommand: CommandDefinition = {
  type: 'OpenJournal',
  displayName: 'Открыть журнал',
  description: 'Открыть журнал класса и группы',
  requiresContext: false, // Не требует контекста, сама устанавливает контекст

  params: [
    {
      name: 'classNumber',
      type: 'string',
      entityCategory: 'ClassNumber',
      required: true,
      description: 'Номер класса (7-11)',
      validate: (value) => {
        const num = parseInt(String(value));
        if (isNaN(num) || num < 7 || num > 11) {
          return 'Класс должен быть от 7 до 11';
        }
        return true;
      }
    },
    {
      name: 'classLetter',
      type: 'string',
      entityCategory: 'ClassLetter',
      required: true,
      description: 'Буква класса (А, Ә, Б, В, Г, Д)',
      validate: (value) => {
        const validLetters = ['А', 'Ә', 'Б', 'В', 'Г', 'Д'];
        const normalized = String(value)
          .toUpperCase()
          .replace(/[-\s]?КЛАССА?/gi, '')
          .trim();

        if (!validLetters.includes(normalized)) {
          return `Буква класса должна быть одной из: ${validLetters.join(', ')}`;
        }

        return true;
      },
      transform: (value) => {
        // Нормализация: убрать " класса", " КЛАССА", "-класса" и т.д.
        const normalized = String(value)
          .toUpperCase()
          .replace(/[-\s]?КЛАССА?/gi, '')
          .trim();

        return normalized;
      }
    },
    {
      name: 'groupNumber',
      type: 'string',
      entityCategory: 'GroupNumber',
      required: false,
      description: 'Номер группы (1 или 2)',
      validate: (value) => {
        const normalized = String(value);
        if (!['1', '2'].includes(normalized)) {
          return 'Группа должна быть 1 или 2';
        }
        return true;
      },
      transform: (value) => {
        // Нормализация: "первая", "первую", "первой" -> "1"
        const str = String(value).toLowerCase();

        if (/^(1|первая|первую|первой|1 группы)$/i.test(str)) return '1';
        if (/^(2|вторая|вторую|второй|2 группы)$/i.test(str)) return '2';

        return str;
      }
    }
  ],

  execute: async (params, _context, _currentLesson) => {
    const classNumber = String(params.classNumber);
    const classLetter = String(params.classLetter);
    const groupNumber = String(params.groupNumber);

    console.log(`🎯 Executing OpenJournal: ${classNumber}${classLetter} группа ${groupNumber}`);

    // Формируем идентификаторы
    const classId = `${classNumber}${classLetter}`;
    const displayName = `${classNumber}${classLetter} ${groupNumber} группа`;

    return {
      success: true,
      message: `Журнал ${displayName} открыт`,
      data: {
        type: 'journal_opened',
        classNumber,
        classLetter,
        groupNumber
      },
      // Обновляем контекст для последующих команд
      updateContext: {
        classId,
        groupId: displayName
      }
    };
  }
};