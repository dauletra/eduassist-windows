// src/electron/api/services/tasks.service.ts

import {shell, app, BrowserWindow} from 'electron';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Сервис для генерации и печати задач
 */
export class TasksService {
  // Печать PDF файла
  async printPDF(filePath: string): Promise<void> {
    try {
      const win = new BrowserWindow({
        show: false,
        webPreferences: {
          plugins: true
        }
      });

      await win.loadURL(`file://${filePath}`)

      await new Promise(resolve => setTimeout(resolve, 1000));

      win.webContents.print({
        silent: false,
        printBackground: true,
      }, (success, errorType) => {
        if (!success) {
          console.log('Ошибка печати: ', errorType);
        }
        win.close();
      });
      console.log('PDF отправлен на печать: ', filePath);
    } catch(error) {
      console.error('Ошибка печати PDF _task.service_:', error);
      throw error;
    }
  }
}

// Экспорт единственного экземпляра (singleton)
export const tasksService = new TasksService();