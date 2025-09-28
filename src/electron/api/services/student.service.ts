// src/electron/api/services/student.service.ts

import type { Class, Student } from '../../shared-types.js';
import { DATA_PATHS } from '../../utils/paths.js';
import { readJsonFile, writeJsonFile } from '../../utils/file-utils.js';

/**
 * Сервис для работы со студентами и классами
 */
export class StudentService {

  /**
   * Загрузить список классов и учеников
   */
  loadStudentsList(): Class[] {
    return readJsonFile<Class[]>(DATA_PATHS.students(), []);
  }

  /**
   * Сохранить список классов
   */
  saveStudentsList(classes: Class[]): boolean {
    return writeJsonFile(DATA_PATHS.students(), classes);
  }

  /**
   * Получить студентов группы по ID
   */
  getStudentsByGroup(classId: string, groupId: string): Student[] {
    const students = this.loadStudentsList();
    const cls = students.find(c => c.id === classId);
    const group = cls?.groups.find(g => g.id === groupId);

    return group?.students || [];
  }

  /**
   * Найти класс по ID
   */
  findClassById(classId: string): Class | null {
    const classes = this.loadStudentsList();
    return classes.find(c => c.id === classId) || null;
  }

  /**
   * Добавить класс
   */
  addClass(newClass: Class): boolean {
    const classes = this.loadStudentsList();
    classes.push(newClass);
    return this.saveStudentsList(classes);
  }

  /**
   * Обновить класс
   */
  updateClass(classId: string, updates: Partial<Class>): boolean {
    const classes = this.loadStudentsList();
    const index = classes.findIndex(c => c.id === classId);

    if (index === -1) {
      return false;
    }

    classes[index] = { ...classes[index], ...updates };
    return this.saveStudentsList(classes);
  }

  /**
   * Удалить класс
   */
  deleteClass(classId: string): boolean {
    const classes = this.loadStudentsList();
    const filtered = classes.filter(c => c.id !== classId);
    return this.saveStudentsList(filtered);
  }
}

export const studentService = new StudentService();