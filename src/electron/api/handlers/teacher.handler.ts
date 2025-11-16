import { shell } from 'electron';
import { ipcMain } from 'electron';
import { presentationService } from '../services/presentation.service.js';
import { tasksService } from '../services/tasks.service.js';
import * as fs from 'fs';

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
      throw error;
    }
  });

  // Открытие любого файла
  ipcMain.handle('open-file', async (_event, filePath: string) => {
    try {
      await presentationService.openPresentation(filePath);
    } catch (error) {
      console.error('❌ Ошибка открытия файла:', error);
      throw error;
    }
  });

  // Закрытие презентации
  ipcMain.handle('close-presentation', async (_event) => {
    try {
      await presentationService.closePresentation();
    } catch (error) {
      console.error('❌ Ошибка закрытия презентации:', error);
      throw error;
    }
  });

  // Закрытие видео
  ipcMain.handle('close-video', async (_event) => {
    try {
      await presentationService.closeVideo();
    } catch (error) {
      console.error('❌ Ошибка закрытия видео:', error);
      throw error;
    }
  });

  // Печать файла
  ipcMain.handle('print-file', async (_event, filePath: string) => {
    try {
      await tasksService.printPDF(filePath);
    } catch (error) {
      console.error('Ошибка печати PDF файла', error)
      throw error;
    }
  })

  // Открытие .url файла
  ipcMain.handle('open-url-file', async (_event, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const match = content.match(/^URL=(.+)$/m);
      if (match) {
        await shell.openExternal(match[1].trim());
      } else {
        throw new Error('URL не найден в файле');
      }
    } catch (err) {
      console.error('Ошибка открытия .url:', err);
      throw err;
    }
  });

  console.log('👨‍🏫 Teacher handlers зарегистрированы');
}