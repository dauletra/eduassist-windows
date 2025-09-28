import { ipcMain } from 'electron';
import type { Class, Student } from '../../shared-types.js';
import { studentService } from '../services/student.service.js';

/**
 * Регистрация обработчиков студентов
 */
export function registerStudentHandlers(): void {

  // Загрузка списка учеников
  ipcMain.handle('load-students-list', async (): Promise<Class[]> => {
    return studentService.loadStudentsList();
  });

  // Разделение учеников на группы
  ipcMain.handle('divide-students', async (_event, classId: string, groupId: string, groupCount: number) => {
    const students = studentService.getStudentsByGroup(classId, groupId);

    if (students.length === 0) {
      console.warn('⚠️ Нет студентов для разделения');
      return [];
    }

    const shuffled = [...students].sort(() => 0.5 - Math.random());
    const groups: typeof students[] = [];
    const studentsPerGroup = Math.ceil(shuffled.length / groupCount);

    for (let i = 0; i < groupCount; i++) {
      const start = i * studentsPerGroup;
      const end = start + studentsPerGroup;
      groups.push(shuffled.slice(start, end));
    }

    console.log(`✅ Студенты разделены на ${groupCount} групп`);
    return groups;
  });

  // Выбор случайного ученика
  ipcMain.handle('select-random-student', async (_event, classId: string, groupId: string): Promise<Student | null> => {
    const students = studentService.getStudentsByGroup(classId, groupId);

    if (students.length === 0) {
      console.warn('⚠️ Нет студентов для выбора');
      return null;
    }

    const selected = students[Math.floor(Math.random() * students.length)];
    console.log(`✅ Выбран студент: ${selected.name}`);
    return selected;
  });

  console.log('👥 Student handlers зарегистрированы');
}