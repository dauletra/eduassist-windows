// src/render/services/commands/newCommands/randomStudent.command.ts

import type { NewCommand, NewCommandResult } from '../NewCommandDispatcher';
import type { AppStore } from '../../../store';
import { voiceCommandBus } from '../../../services/CommandEventBus';

/**
 * Новая команда случайного выбора ученика
 */
export const randomStudentCommand: NewCommand = {
  type: 'RandomStudent',

  async execute(store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const { onlyPresent = true } = params;
    const state = store.getState();

    if (!state.currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал класса'
      };
    }

    const allStudents = state.currentLesson.students;

    if (!allStudents || allStudents.length === 0) {
      return {
        success: false,
        message: 'В текущем уроке нет учеников'
      };
    }

    // Определить пул учеников для выбора
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

    // ИЗМЕНЕНО: Публикуем событие для UI
    voiceCommandBus.emit('random_student_selected', {
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      totalCandidates: candidateStudents.length
    });

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