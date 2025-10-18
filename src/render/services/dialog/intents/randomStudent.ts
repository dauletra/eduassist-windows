import type { IntentDefinition, ActionResult } from './types';
// import type { CommandContext } from '../DialogState';

export const randomStudentIntent: IntentDefinition = {
  name: 'RandomStudent',
  displayName: 'Выбрать случайного ученика',
  requiresContext: true,

  slots: [], // Нет слотов - команда без параметров

  action: async (slots, context): Promise<ActionResult> => {
    if (!context.students || context.students.length === 0) {
      return {
        success: false,
        message: 'Список учеников пуст. Сначала откройте журнал'
      };
    }

    // Выбрать случайного ученика
    const randomIndex = Math.floor(Math.random() * context.students.length);
    const selected = context.students[randomIndex];

    console.log('🎲 Random student selected:', selected.name, typeof slots);

    // TODO: Отобразить в UI
    // window.electron.showRandomStudent(selected)

    return {
      success: true,
      message: `Выбран ученик: ${selected.name}`,
      data: {
        type: 'random_student',
        student: selected
      }
    };
  }
};