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

  // Открытие любого файла
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    try {
      await presentationService.openPresentation(filePath);
    } catch (error) {
      console.error('❌ Ошибка открытия файла:', error);
    }
  });

  // Печать файла
  ipcMain.handle('print-file', async (_event, filePath: string) => {
    try {
      await tasksService.printPDF(filePath);
    } catch (error) {
      console.error('Ошибка печати PDF файла', error)
    }
  })

  console.log('👨‍🏫 Teacher handlers зарегистрированы');
}