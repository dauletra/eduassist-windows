// src/electron/api/services/tasks.service.ts

import { BrowserWindow } from 'electron';
import { fileExists } from '../../utils/file-utils.js';
import { configService } from './config.service.js';
import { hasMainWindow, getMainWindow } from "../../windows/main-window.js";
import {printerService} from "./printer.service.js";


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
      const printersStatus = await printerService.getPrintersStatus(false);

      // Получаем список принтеров из главного окна
      const mainWindow = getMainWindow();
      const printers = await mainWindow.webContents.getPrintersAsync();

      // Если указан принтер по умолчанию, проверяем его доступность
      if (defaultPrinter) {
        const isDefaultAvailable = printersStatus.get(defaultPrinter);

        if (!isDefaultAvailable) {
          // Ищем альтернативный доступный принтер
          const availablePrinters = Array.from(printersStatus.entries())
            .filter(([_, isAvailable]) => isAvailable)
            .map(([name]) => name);

          if (availablePrinters.length > 0) {
            throw new Error(
              `Принтер по умолчанию "${defaultPrinter}" недоступен. ` +
              `Доступные принтеры: ${availablePrinters.join(', ')}. ` +
              `Измените принтер по умолчанию в настройках устройств.`
            );
          } else {
            throw new Error(
              `Принтер по умолчанию "${defaultPrinter}" недоступен и нет других доступных принтеров`
            );
          }
        }
      } else {
        // Если принтер по умолчанию не установлен
        const availablePrinters = Array.from(printersStatus.entries())
          .filter(([_, isAvailable]) => isAvailable)
          .map(([name]) => name);

        if (availablePrinters.length === 0) {
          throw new Error('Нет доступных принтеров');
        }

        throw new Error(
          `Принтер по умолчанию не настроен. ` +
          `Доступные принтеры: ${availablePrinters.join(', ')}. ` +
          `Установите принтер по умолчанию в настройках устройств.`
        );
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

      // Отправляем на печать
      win.webContents.print(printOptions, (success, errorType) => {
        if (!success) {
          console.error('❌ Ошибка печати:', errorType);
        } else {
          console.log('✅ PDF успешно отправлен на печать:', filePath);
        }

        // Закрываем окно после отправки на печать
        if (win && !win.isDestroyed()) {
          win.close();
        }
      });

    } catch (error) {
      console.error('❌ Ошибка печати PDF:', error);
      // Всегда закрываем окно
      if (win && !win.isDestroyed()) {
        win.close();
      }
      throw error;
    }
  }
}

// Экспорт единственного экземпляра (singleton)
export const tasksService = new TasksService();