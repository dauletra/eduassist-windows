// src/render/services/commands/newCommands/setGrade.command.ts

import type { NewCommand, NewCommandResult } from '../NewCommandDispatcher';
import type { AppStore } from '../../../store';

/**
 * Новая команда постановки оценки - работает напрямую со Store
 */
export const setGradeCommand: NewCommand = {
  type: 'SetGrade',

  async execute(store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const { studentName, numberValue } = params;
    const state = store.getState();

    if (!state.currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал'
      };
    }

    const studentNameOrId = String(studentName).toLowerCase().trim();
    const grade = Number(numberValue);

    console.log(`🎯 Executing SetGrade: ${studentNameOrId} -> ${grade}`);

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
        message: `Ученик "${studentName}" не найден в списке`
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