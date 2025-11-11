// src/render/services/commands/newCommands/setGrade.command.ts

import type { NewCommand, NewCommandResult } from '../NewCommandDispatcher';
import type { AppStore } from '../../../store';

/**
 * Новая команда постановки оценки - работает напрямую со Store
 */
export const setGradeCommand: NewCommand = {
  type: 'SetGrade',

  async execute(store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const StudentName = params.StudentName || params.studentName;
    const NumberValue = params.NumberValue || params.numberValue;
    const state = store.getState();

    if (!state.currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал'
      };
    }

    const studentNameOrId = String(StudentName).toLowerCase().trim();

    let grade: number | null = null;
    if (NumberValue !== null && NumberValue !== undefined && NumberValue !== '' && NumberValue !== 0) {
      grade = Number(NumberValue);
      // Проверяем, что это валидное число
      if (isNaN(grade)) {
        return {
          success: false,
          message: `"${NumberValue}" не является числом`
        };
      }
    }

    console.log(`🎯 Executing SetGrade: ${studentNameOrId} -> ${grade === null ? 'REMOVE' : grade}`);

    // Найти ученика по ID или имени
    let student = state.currentLesson.students.find(s => s.id === studentNameOrId);

    if (!student) {
      student = state.currentLesson.students.find(s =>
        s.name.toLowerCase().includes(studentNameOrId)
      );
    }

    if (!student) {
      return {
        success: false,
        message: `Ученик "${StudentName}" не найден в списке`
      };
    }

    console.log(`✅ Student found:`, student.name);

    // Обновить состояние
    const updatedStudents = state.currentLesson.students.map(s =>
      s.id === student!.id ? { ...s, grade } : s
    );

    const updatedLessons = state.lessons.map(lesson =>
      lesson.id === state.currentLessonId
        ? { ...lesson, students: updatedStudents }
        : lesson
    );

    return {
      success: true,
      message: `Оценка ${grade} поставлена ученику ${student.name}`,
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