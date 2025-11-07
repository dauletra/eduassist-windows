import type { IntentDefinition, ActionResult } from './types';
// import type { Lesson } from '../../../types';

export const randomStudentIntent: IntentDefinition = {
  name: 'RandomStudent',
  displayName: 'Выбрать случайного ученика',
  requiresContext: true,

  slots: [], // Нет слотов - команда без параметров

  action: async (_slots, _context, currentLesson): Promise<ActionResult> => {
    // Проверка есть ли текущий урок
    if (!currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал класса'
      };
    }

    const allStudents = currentLesson.students;

    if (!allStudents || allStudents.length === 0) {
      return {
        success: false,
        message: 'В текущем уроке нет учеников'
      };
    }

    const presentStudents = allStudents.filter(student => student.attendance);

    if (presentStudents.length === 0) {
      return {
        success: false,
        message: 'Нет присутствующих учеников для выбора'
      };
    }

    const randomIndex = Math.floor(Math.random() * presentStudents.length);
    const selectedStudent = presentStudents[randomIndex];

    console.log('🎲 Random student selected:', selectedStudent);

    return {
      success: true,
      message: `Выбран ученик: ${selectedStudent.id}`,
      data: {
        type: 'random_student',
        studentId: selectedStudent.id,
        studentName: selectedStudent.name
      }
    };
  }
};