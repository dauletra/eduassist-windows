import type { CommandDefinition } from '../types';

/**
 * Команда случайного выбора ученика из присутствующих
 *
 * Может быть вызвана:
 * - Голосом: "Выбери случайного ученика"
 * - UI: кнопка "Случайный выбор" в рандомайзере
 * - Горячие клавиши: Ctrl+R
 */
export const randomStudentCommand: CommandDefinition = {
  type: 'RandomStudent',
  displayName: 'Выбрать случайного ученика',
  description: 'Случайно выбрать одного ученика из присутствующих на уроке',
  requiresContext: true,

  params: [
    {
      name: 'onlyPresent',
      type: 'boolean',
      required: false,
      default: true,
      description: 'Выбирать только из присутствующих учеников'
    }
  ],

  execute: async (params, _context, currentLesson) => {
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

    // Определить пул учеников для выбора
    const onlyPresent = params.onlyPresent !== false; // по умолчанию true
    const candidateStudents = onlyPresent
      ? allStudents.filter(student => student.attendance)
      : allStudents;

    if (candidateStudents.length === 0) {
      return {
        success: false,
        message: onlyPresent
          ? 'Нет присутствующих учеников для выбора'
          : 'Нет учеников для выбора'
      };
    }

    // Случайный выбор
    const randomIndex = Math.floor(Math.random() * candidateStudents.length);
    const selectedStudent = candidateStudents[randomIndex];

    console.log(`🎲 Random student selected: ${selectedStudent.name} (${selectedStudent.id})`);

    return {
      success: true,
      message: `Выбран ученик: ${selectedStudent.name}`,
      data: {
        type: 'random_student_selected',
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        totalCandidates: candidateStudents.length
      }
    };
  }
};