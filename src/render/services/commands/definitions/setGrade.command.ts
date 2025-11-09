import type { CommandDefinition } from '../types';
import { COMMAND_EVENTS } from '../types';

/**
 * Команда постановки оценки ученику
 *
 * Может быть вызвана:
 * - Голосом: "Поставь Султану 8 баллов"
 * - UI: клик на оценку в журнале
 * - Горячие клавиши: выбрать ученика + цифра
 */
export const setGradeCommand: CommandDefinition = {
  type: 'SetGrade',
  displayName: 'Поставить оценку',
  description: 'Выставить оценку ученику в текущем уроке',
  requiresContext: true,

  params: [
    {
      name: 'studentName',
      type: 'student',
      entityCategory: 'StudentName',
      required: true,
      description: 'Имя ученика (для голоса) или ID ученика (для UI)',
      validate: (value, _context, currentLesson) => {
        if (!currentLesson) {
          return 'Урок не загружен';
        }

        const input = String(value).toLowerCase().trim();

        // Если это studentId (например, s001), проверить напрямую
        if (input.startsWith('s') && input.length === 4) {
          const student = currentLesson.students.find(s => s.id === input);
          if (student) return true;
        }

        // Если это имя, искать по подстроке
        if (input.length < 2) {
          return 'Имя слишком короткое';
        }

        const student = currentLesson.students.find(s =>
          s.name.toLowerCase().includes(input)
        );

        if (!student) {
          return `Ученик "${value}" не найден в списке`;
        }

        return true;
      },
      transform: (value) => {
        return String(value).trim().replace(/\s+/g, ' ');
      }
    },
    {
      name: 'numberValue',
      type: 'number',
      entityCategory: 'NumberValue',
      required: true,
      description: 'Оценка от 1 до 10',
      validate: (value) => {
        const grade = Number(value);

        if (isNaN(grade)) {
          return 'Оценка должна быть числом';
        }

        if (!Number.isInteger(grade) || grade < 1 || grade > 10) {
          return 'Оценка должна быть целым числом от 1 до 10';
        }

        return true;
      },
      transform: (value) => {
        // Поддержка слов-чисел для голоса
        const numberWords: Record<string, number> = {
          'один': 1, 'одна': 1,
          'два': 2, 'две': 2,
          'три': 3, 'трое': 3,
          'четыре': 4,
          'пять': 5,
          'шесть': 6,
          'семь': 7,
          'восемь': 8,
          'девять': 9,
          'десять': 10
        };

        const normalized = String(value).toLowerCase().trim();
        return numberWords[normalized] ?? Number(value);
      }
    }
  ],

  execute: async (params, _context, currentLesson) => {
    if (!currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал'
      };
    }

    const studentNameOrId = String(params.studentName).toLowerCase().trim();
    const grade = Number(params.numberValue);

    console.log(`🎯 Executing SetGrade: ${studentNameOrId} -> ${grade}`);

    // Найти ученика по ID или имени
    let student = currentLesson.students.find(s => s.id === studentNameOrId);

    if (!student) {
      student = currentLesson.students.find(s =>
        s.name.toLowerCase().includes(studentNameOrId)
      );
    }

    if (!student) {
      return {
        success: false,
        message: `Ученик "${params.studentName}" не найден в списке`
      };
    }

    console.log(`✅ Student found:`, student.name);

    return {
      success: true,
      message: `Оценка ${grade} поставлена ученику ${student.name}`,
      data: {
        type: 'grade_set',
        lessonId: currentLesson.id,
        studentId: student.id,
        studentName: student.name,
        grade
      },
      // Публикуем событие об установке оценки
      events: [
        {
          type: COMMAND_EVENTS.GRADE_SET,
          payload: {
            studentId: student.id,
            grade
          }
        }
      ]
    };
  }
};