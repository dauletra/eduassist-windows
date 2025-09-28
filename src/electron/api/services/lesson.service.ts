// src/electron/api/services/lesson.service.ts

import type { Lesson } from '../../shared-types.js';
import { DATA_PATHS } from '../../utils/paths.js';
import { readJsonFile, writeJsonFile } from '../../utils/file-utils.js';
import { studentService } from './student.service.js';

/**
 * Сервис для работы с уроками и журналом
 */
export class LessonService {
  private saveTimeout: NodeJS.Timeout | null = null;

  /**
   * Загрузить журнал уроков
   */
  loadJournal(): Lesson[] {
    return readJsonFile<Lesson[]>(DATA_PATHS.journal(), []);
  }

  /**
   * Сохранить журнал уроков
   */
  saveJournal(journal: Lesson[]): boolean {
    return writeJsonFile(DATA_PATHS.journal(), journal);
  }

  /**
   * Отложенное сохранение журнала (debounce)
   */
  private debounceSaveJournal(journal: Lesson[]): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveJournal(journal);
      this.saveTimeout = null;
    }, 500);
  }

  /**
   * Принудительное сохранение всех изменений
   */
  flushUpdates(): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      const journal = this.loadJournal();
      this.saveJournal(journal);
      this.saveTimeout = null;
    }
  }

  /**
   * Получить урок на сегодня
   */
  getTodayLesson(classId: string, groupId: string): Lesson | null {
    const journal = this.loadJournal();
    const today = new Date().toISOString().split('T')[0];

    return journal.find(lesson =>
      lesson.date === today &&
      lesson.classId === classId &&
      lesson.groupId === groupId
    ) || null;
  }

  /**
   * Создать новый урок
   */
  createLesson(classId: string, groupId: string, topic: string): Lesson {
    const students = studentService.loadStudentsList();
    const cls = students.find(c => c.id === classId);
    const group = cls?.groups.find(g => g.id === groupId);

    if (!group) {
      throw new Error('Группа не найдена');
    }

    const lesson: Lesson = {
      id: `lesson-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      topic,
      classId,
      groupId,
      students: group.students.map(student => ({
        id: student.id,
        attendance: true,
        grade: null
      }))
    };

    const journal = this.loadJournal();
    journal.push(lesson);
    this.saveJournal(journal);

    return lesson;
  }

  /**
   * Обновить посещаемость ученика
   */
  updateAttendance(lessonId: string, studentId: string, attendance: boolean): boolean {
    const journal = this.loadJournal();
    const lesson = journal.find(l => l.id === lessonId);
    const student = lesson?.students.find(s => s.id === studentId);

    if (student) {
      student.attendance = attendance;
      this.debounceSaveJournal(journal);
      return true;
    }

    return false;
  }

  /**
   * Обновить оценку ученика
   */
  updateGrade(lessonId: string, studentId: string, grade: number | null): boolean {
    const journal = this.loadJournal();
    const lesson = journal.find(l => l.id === lessonId);
    const student = lesson?.students.find(s => s.id === studentId);

    if (student) {
      student.grade = grade;
      this.debounceSaveJournal(journal);
      return true;
    }

    return false;
  }

  /**
   * Найти урок по ID
   */
  findLessonById(lessonId: string): Lesson | null {
    const journal = this.loadJournal();
    return journal.find(l => l.id === lessonId) || null;
  }

  /**
   * Получить все уроки для класса/группы
   */
  getLessonsByGroup(classId: string, groupId: string): Lesson[] {
    const journal = this.loadJournal();
    return journal.filter(l => l.classId === classId && l.groupId === groupId);
  }
}

export const lessonService = new LessonService();