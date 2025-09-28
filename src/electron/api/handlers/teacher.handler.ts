import { ipcMain } from 'electron';
import { presentationService } from '../services/presentation.service.js';
import { tasksService } from '../services/tasks.service.js';

/**
 * Регистрация команд учителя
 */
export function registerTeacherHandlers(): void {

  // Открытие презентации
  ipcMain.handle('open-presentation', async (_event, presentationName: string) => {
    try {
      await presentationService.openPresentation(presentationName);
    } catch (error) {
      console.error('❌ Ошибка открытия презентации:', error);
    }
  });

  // Печать задач
  ipcMain.handle('print-tasks', async () => {
    try {
      await tasksService.generateAndPrint();
    } catch (error) {
      console.error('❌ Ошибка печати задач:', error);
    }
  });

  console.log('👨‍🏫 Teacher handlers зарегистрированы');
}