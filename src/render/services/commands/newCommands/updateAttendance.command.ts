// src/render/services/commands/newCommands/updateAttendance.command.ts

import type { NewCommand, NewCommandResult } from '../NewCommandDispatcher';
import type { AppStore } from '../../../store';

/**
 * Новая команда обновления посещаемости
 */
export const updateAttendanceCommand: NewCommand = {
  type: 'UpdateAttendance',

  async execute(store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const { studentId, attendance } = params;
    const state = store.getState();

    if (!state.currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал'
      };
    }

    console.log('✅ Updating attendance:', studentId, attendance);

    // Найти ученика
    const student = state.currentLesson.students.find(s => s.id === studentId);
    if (!student) {
      return {
        success: false,
        message: `Ученик с ID ${studentId} не найден`
      };
    }

    // Обновить состояние
    const updatedStudents = state.currentLesson.students.map(s =>
      s.id === studentId ? { ...s, attendance } : s
    );

    const updatedLessons = state.lessons.map(lesson =>
      lesson.id === state.currentLessonId
        ? { ...lesson, students: updatedStudents }
        : lesson
    );

    const action = attendance ? 'присутствует' : 'отсутствует';

    return {
      success: true,
      message: `Ученик ${student.name} отмечен как ${action}`,
      newState: {
        lessons: updatedLessons,
        currentLesson: {
          ...state.currentLesson,
          students: updatedStudents
        }
      }
    };
  }
};