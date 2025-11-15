import { ipcMain } from 'electron';
import type { Lesson, TaskStatus } from '../../shared-types.js';
import { lessonService } from '../services/lesson.service.js';

/**
 * Регистрация обработчиков уроков
 */
export function registerLessonHandlers(): void {
  // ✅ ДОБАВЛЕНО: Загрузить весь журнал (все уроки)
  ipcMain.handle('load-journal', async (): Promise<Lesson[]> => {
    return lessonService.getAllLessons();
  });

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

  // Обновить статус задания
  ipcMain.handle('update-task-status', async (_event, lessonId: string, studentId: string, taskIndex: number, status: TaskStatus): Promise<boolean> => {
    const result = lessonService.updateTaskStatus(lessonId, studentId, taskIndex, status);
    if (result) {
      const statusNames = ['пусто', 'правильно', 'неправильно', 'половина'];
      console.log(`✅ Статус задания обновлен: ${studentId} - задание ${taskIndex + 1}: ${statusNames[status]}`);
    }
    return result;
  });

  ipcMain.handle('get-lessons-by-group', async (_event, classId: string, groupId: string): Promise<Lesson[]> => {
    const lessons = lessonService.getLessonsByGroup(classId, groupId);
    return lessons.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  })

  console.log('📚 Lesson handlers зарегистрированы');
}
