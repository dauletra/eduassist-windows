import { ipcMain } from 'electron';
import type { Lesson } from '../../shared-types.js';
import { lessonService } from '../services/lesson.service.js';

/**
 * Регистрация обработчиков уроков
 */
export function registerLessonHandlers(): void {

  // Получить урок на сегодня
  ipcMain.handle('get-today-lesson', async (_event, classId: string, groupId: string): Promise<Lesson | null> => {
    return lessonService.getTodayLesson(classId, groupId);
  });

  // Создать новый урок
  ipcMain.handle('create-lesson', async (_event, classId: string, groupId: string, topic: string): Promise<Lesson> => {
    const lesson = lessonService.createLesson(classId, groupId, topic);
    console.log(`✅ Урок создан: ${topic}`);
    return lesson;
  });

  // Обновить посещаемость
  ipcMain.handle('update-attendance', async (_event, lessonId: string, studentId: string, attendance: boolean): Promise<boolean> => {
    const result = lessonService.updateAttendance(lessonId, studentId, attendance);
    if (result) {
      console.log(`✅ Посещаемость обновлена: ${studentId} - ${attendance ? 'присутствует' : 'отсутствует'}`);
    }
    return result;
  });

  // Обновить оценку
  ipcMain.handle('update-grade', async (_event, lessonId: string, studentId: string, grade: number | null): Promise<boolean> => {
    const result = lessonService.updateGrade(lessonId, studentId, grade);
    if (result) {
      console.log(`✅ Оценка обновлена: ${studentId} - ${grade ?? 'не выставлена'}`);
    }
    return result;
  });

  console.log('📚 Lesson handlers зарегистрированы');
}
