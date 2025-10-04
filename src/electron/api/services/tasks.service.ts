// src/electron/api/services/tasks.service.ts

import { BrowserWindow } from 'electron';
import { fileExists } from '../../utils/file-utils.js';
import { configService } from './config.service.js';
import { hasMainWindow, getMainWindow } from "../../windows/main-window.js";


export class TasksService {
  // Печать PDF файла
  async printPDF(filePath: string): Promise<void> {
    let win: BrowserWindow | null = null;

    try {
      // Проверяем существование файла
      if (!fileExists(filePath)) {
        throw new Error(`Файл не найден: ${filePath}`);
      }

      // Проверяем наличие главного окна
      if (!hasMainWindow()) {
        throw new Error('Главное окно не инициализировано');
      }

      // Получаем настройки принтера по умолчанию
      const settings = configService.loadConfig();
      const defaultPrinter = settings.devices?.defaultPrinter;

      // Получаем список принтеров из главного окна
      const mainWindow = getMainWindow();
      const printers = await mainWindow.webContents.getPrintersAsync();

      // Если указан принтер по умолчанию, проверяем его доступность
      if (defaultPrinter) {
        const printer = printers.find(p => p.name === defaultPrinter);

        if (!printer) {
          throw new Error(`Принтер "${defaultPrinter}" не найден`);
        }

        if (printer.status !== 0) {
          throw new Error(`Принтер "${defaultPrinter}" недоступен или отключен`);
        }
      } else {
        // Если принтер не указан, проверяем наличие хотя бы одного доступного
        const availablePrinters = printers.filter(p => p.status === 0);

        if (availablePrinters.length === 0) {
          throw new Error('Нет доступных принтеров');
        }
      }

      // Создаем скрытое окно для загрузки PDF
      win = new BrowserWindow({
        show: false,
        webPreferences: {
          plugins: true,
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      // Загружаем PDF файл
      await win.loadFile(filePath);

      // Даем время на загрузку PDF
      await new Promise(resolve => setTimeout(resolve, 2000));

      const printOptions: any = {
        silent: true, // Печать без диалога
        printBackground: true,
        color: true,
        margins: {
          marginType: 'default'
        },
        landscape: false,
        pagesPerSheet: 1,
        collate: false,
        copies: 1
      };

      // Если указан принтер по умолчанию, используем его
      if (defaultPrinter) {
        printOptions.deviceName = defaultPrinter;
      }

      // Отправляем на печать с таймаутом
      // Отправляем на печать с таймаутом
      await Promise.race([
        new Promise<void>((resolve, reject) => {
          win!.webContents.print(printOptions, (success, errorType) => {
            if (!success) {
              console.error('❌ Ошибка печати:', errorType);
              reject(new Error(`Ошибка печати: ${errorType || 'неизвестная ошибка'}`));
            } else {
              console.log('✅ PDF успешно отправлен на печать:', filePath);
              resolve();
            }
          });
        }),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('Превышено время ожидания печати')), 10000)
        )
      ]);

    } catch (error) {
      console.error('❌ Ошибка печати PDF:', error);
      throw error;
    } finally {
      // Всегда закрываем окно
      if (win && !win.isDestroyed()) {
        win.close();
      }
    }
  }
}

// Экспорт единственного экземпляра (singleton)
export const tasksService = new TasksService();