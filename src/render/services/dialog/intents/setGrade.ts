import type { IntentDefinition, ActionResult } from './types';
// import type { CommandContext } from '../DialogState';

export const setGradeIntent: IntentDefinition = {
  name: 'SetGrade',
  displayName: 'Поставить оценку',
  requiresContext: true,

  slots: [
    {
      name: 'studentName',
      required: true,
      type: 'student',
      entityCategory: 'StudentName',
      prompt: 'Кому поставить оценку?',
      validate: (value, context) => {
        const name = String(value).trim();
        if (name.length < 2) {
          return 'Имя слишком короткое';
        }

        if (context.students && context.students.length > 0) {
          const found = context.students.some(s =>
            s.name.toLowerCase().includes(name.toLowerCase())
          );

          if (!found) {
            return `Ученик "${name}" не найден в списке`;
          }
        }

        return true;
      },
      transform: (value) => {
        return String(value).trim().replace(/\s+/g, ' ');
      }
    },
    {
      name: 'numberValue',
      required: true,
      type: 'number',
      entityCategory: 'NumberValue',
      prompt: 'Какую оценку поставить? От 1 до 10',
      validate: (value) => {
        const grade = Number(value);
        if (!Number.isInteger(grade) || grade < 1 || grade > 10) {
          return 'Оценка должна быть целым числом от 1 до 10';
        }
        return true;
      },
      transform: (value) => {
        const numberWords: Record<string, number> = {
          'один': 1, 'одна': 1, 'два': 2, 'две': 2, 'три': 3, 'трое': 3,
          'четыре': 4, 'пять': 5, 'шесть': 6, 'семь': 7,
          'восемь': 8, 'девять': 9, 'десять': 10
        };

        const normalized = String(value).toLowerCase().trim();
        return numberWords[normalized] ?? Number(value);
      }
    }
  ],

  action: async (slots): Promise<ActionResult> => {
    const studentName = slots.studentName;
    const grade = slots.numberValue;

    console.log(`✅ Setting grade ${grade} for student ${studentName}`);

    // TODO: Записать оценку через IPC
    // await window.electron.updateGrade(context.lessonId, studentId, grade)

    return {
      success: true,
      message: `Оценка ${grade} поставлена ученику ${studentName}`,
      data: {
        type: 'grade_set',
        studentName,
        grade
      }
    };
  }
};