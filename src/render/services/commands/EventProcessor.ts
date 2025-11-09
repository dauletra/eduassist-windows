// src/render/services/commands/EventProcessor.ts

import type { CommandEvent, DialogContext } from './types';
import type { EnrichedLesson } from '../../types';

/**
 * Обработчик событий команд
 * Преобразует события в обновления React состояния
 */
export class EventProcessor {
  private setContext: (updater: (prev: DialogContext) => DialogContext) => void;
  private setCurrentLesson: (updater: (prev: EnrichedLesson | null) => EnrichedLesson | null) => void;

  constructor(
    setContext: (updater: (prev: DialogContext) => DialogContext) => void,
    setCurrentLesson: (updater: (prev: EnrichedLesson | null) => EnrichedLesson | null) => void
  ) {
    this.setContext = setContext;
    this.setCurrentLesson = setCurrentLesson;
  }

  /**
   * Обработать массив событий
   */
  processEvents(events: CommandEvent[]): void {
    console.log('🔄 Processing events:', events);

    events.forEach(event => {
      this.processEvent(event);
    });
  }

  /**
   * Обработать одно событие
   */
  private processEvent(event: CommandEvent): void {
    switch (event.type) {
      case 'journal_opened':
        this.handleJournalOpened(event.payload);
        break;

      case 'grade_set':
        this.handleGradeSet(event.payload);
        break;

      case 'student_selected':
        this.handleStudentSelected(event.payload);
        break;

      case 'students_divided':
        this.handleStudentsDivided(event.payload);
        break;

      case 'lesson_updated':
        this.handleLessonUpdated(event.payload);
        break;

      case 'view_changed':
        this.handleViewChanged(event.payload);
        break;

      default:
        console.warn(`⚠️ Unknown event type: ${event.type}`);
    }
  }

  /**
   * Журнал открыт - обновить context
   */
  private handleJournalOpened(payload: { classId: string; groupId: string; lessonId?: string }): void {
    console.log('📖 Journal opened:', payload);

    this.setContext(prev => ({
      ...prev,
      classId: payload.classId,
      groupId: payload.groupId,
      lessonId: payload.lessonId
    }));
  }

  /**
   * Оценка поставлена - обновить урок
   */
  private handleGradeSet(payload: { studentId: string; grade: number }): void {
    console.log('📝 Grade set:', payload);

    this.setCurrentLesson(lesson => {
      if (!lesson) return lesson;

      // Обновить оценку ученика в списке
      const updatedStudents = lesson.students.map(student =>
        student.id === payload.studentId
          ? { ...student, grade: payload.grade }
          : student
      );

      return {
        ...lesson,
        students: updatedStudents
      };
    });
  }

  /**
   * Ученик выбран - можно добавить в context
   */
  private handleStudentSelected(payload: { studentId: string; studentName: string }): void {
    console.log('👤 Student selected:', payload);

    // Можно расширить context для хранения выбранного ученика
    // Пока просто логируем
  }

  /**
   * Ученики разделены на группы
   */
  private handleStudentsDivided(payload: { groups: any[]; method: string }): void {
    console.log('👥 Students divided:', payload);

    // Можно добавить группы в context если нужно
    // Или обновить currentLesson с группами
  }

  /**
   * Урок обновлён
   */
  private handleLessonUpdated(payload: { lesson: EnrichedLesson }): void {
    console.log('📚 Lesson updated:', payload);

    this.setCurrentLesson(() => payload.lesson);
  }

  /**
   * Изменение вида/экрана
   */
  private handleViewChanged(payload: { view: string }): void {
    console.log('🖥️ View changed:', payload);

    // Можно добавить currentView в context если нужно
  }
}