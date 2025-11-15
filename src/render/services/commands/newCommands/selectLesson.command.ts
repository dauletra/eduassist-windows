// src/render/services/commands/newCommands/selectLesson.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';

export const selectLessonCommand: Command = {
  type: 'SelectLesson',
  async execute(store: AppStore, params: Record<string, any>) {
    const { lessonId } = params;

    if (!lessonId) {
      return { success: false, message: 'Не указан ID урока' };
    }

    const state = store.getState();
    const lesson = state.lessons.find(l => l.id === lessonId);

    if (!lesson) {
      return { success: false, message: 'Урок не найден' };
    }

    store.setState(prev => ({
      ...prev,
      currentLessonId: lessonId
    }));

    return {
      success: true,
      message: `Выбран урок: ${lesson.topic || lesson.date}`
    };
  }
};