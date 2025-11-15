// src/render/services/commands/newCommands/randomStudent.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { StudentService } from '../../domain/StudentService';
import { commandEventBus } from '../../CommandEventBus.ts';

export const randomStudentCommand: Command = {
  type: 'RandomStudent',
  async execute(store: AppStore, params: Record<string, any>) {
    const { onlyPresent = true } = params;
    const state = store.getState();
    if (!state.currentLesson) return { success: false, message: 'Нет активного урока' };

    const students = new StudentService(store).listCurrentLessonStudents();
    const pool = onlyPresent ? students.filter(s => s.attendance) : students;
    if (pool.length === 0) {
      return { success: false, message: onlyPresent ? 'Нет присутствующих учеников' : 'Нет учеников для выбора' };
    }

    const selected = pool[Math.floor(Math.random() * pool.length)];
    const data = { type: 'random_student_selected', studentId: selected.id, studentName: selected.name, totalCandidates: pool.length };
    commandEventBus.emit('random_student_selected', data);
    return { success: true, message: `Выбран ученик: ${selected.name}`, data };
  }
};
