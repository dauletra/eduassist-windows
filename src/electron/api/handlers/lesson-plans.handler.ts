// src/electron/api/handlers/lesson-plans.handler.ts
import { ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs/promises';
import type { ClassFolder, LessonFolder, FileItem } from '../../shared-types.js';
import { fileExists } from '../../utils/file-utils.js';
import { configService } from '../services/config.service.js'

let currentClass: string = '';

/**
 * Регистрация обработчиков для работы с поурочными планами
 */
export function registerLessonPlansHandlers(): void {

  // Выбор папки поурочных планов
  ipcMain.handle('select-lesson-plans-folder', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Выберите папку с поурочными планами'
    });

    return result.canceled ? null : result.filePaths[0];
  });

  // Сохранение пути папки поурочных планов
  ipcMain.handle('save-lesson-plans-path', async (_event, pathToSave: string): Promise<boolean> => {
    try {
      const config = configService.loadConfig();
      config.paths.lessonPlansDir = pathToSave; // Добавим новое поле
      configService.updateConfig(config);
      console.log(`✅ Путь к поурочным планам сохранен: ${pathToSave}`);
      return true;
    } catch (error) {
      console.error('❌ Ошибка сохранения пути:', error);
      return false;
    }
  });

  // Получение сохраненного пути
  ipcMain.handle('get-lesson-plans-path', async (): Promise<string> => {
    const config = configService.loadConfig();
    const savedPath = config.paths.lessonPlansDir || '';

    // Проверяем существование пути
    if (savedPath && !fileExists(savedPath)) {
      console.warn('⚠️ Сохраненный путь не существует:', savedPath);
      // Очищаем невалидный путь
      config.paths.lessonPlansDir = '';
      configService.updateConfig(config);
      return '';
    }

    return savedPath;
  });

  // Сканирование папки поурочных планов
  ipcMain.handle('scan-lesson-plans', async (_event, basePath: string): Promise<ClassFolder[]> => {
    try {
      // Проверяем существование пути
      if (!fileExists(basePath)) {
        console.error('❌ Путь не существует:', basePath);
        return [];
      }

      const classes: ClassFolder[] = [];
      const entries = await fs.readdir(basePath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          // Фильтр для классов (например, "7 МК", "9 МР", "8 МК ДО")
          if (/^\d+\s+(МК|МР|ДО)/.test(entry.name)) {
            const classPath = path.join(basePath, entry.name);
            const lessons = await scanLessonsInClass(classPath);

            classes.push({
              name: entry.name,
              path: classPath,
              lessons: lessons
            });
          }
        }
      }

      console.log(`✅ Найдено классов: ${classes.length}`);
      return classes;
    } catch (error) {
      console.error('❌ Ошибка сканирования папки:', error);
      return [];
    }
  });

  // Получение текущего класса
  ipcMain.handle('get-current-class', async (): Promise<string> => {
    return currentClass;
  });

  // Установка текущего класса
  ipcMain.handle('set-current-class', async (_event, className: string): Promise<boolean> => {
    try {
      currentClass = className;
      console.log(`✅ Текущий класс установлен: ${className}`);
      return true;
    } catch (error) {
      console.error('❌ Ошибка установки класса:', error);
      return false;
    }
  });

  // Получение файлов урока
  ipcMain.handle('get-lesson-files', async (_event, lessonPath: string): Promise<FileItem[]> => {
    try {
      // Проверка существования директории
      if (!fileExists(lessonPath)) {
        console.warn(`⚠️ Путь не существует: ${lessonPath}`);
        return [];
      }

      const files: FileItem[] = [];
      const entries = await fs.readdir(lessonPath, { withFileTypes: true });

      for (const entry of entries) {
        const filePath = path.join(lessonPath, entry.name);

        try {
          const stats = await fs.stat(filePath);

          files.push({
            name: entry.name,
            path: filePath,
            type: entry.isDirectory() ? 'directory' : 'file',
            extension: entry.isFile() ? path.extname(entry.name) : undefined,
            size: entry.isFile() ? stats.size : undefined,
          });
        } catch (statError) {
          console.warn(`⚠️ Не удалось получить информацию о файле ${entry.name}:`, statError);
        }
      }

      // Сортировка: сначала папки, потом файлы, по алфавиту
      files.sort((a, b) => {
        if (a.type === 'directory' && b.type === 'file') return -1;
        if (a.type === 'file' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name, 'ru');
      });

      return files;
    } catch (error) {
      console.error(`❌ Ошибка чтения файлов урока:`, error);
      return [];
    }
  });

  console.log('📁 Lesson Plans handlers зарегистрированы');
}

/**
 * Сканирование уроков в папке класса
 */
async function scanLessonsInClass(classPath: string): Promise<LessonFolder[]> {
  const lessons: LessonFolder[] = [];

  try {
    const entries = await fs.readdir(classPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Формат: "X апта Y сабақ" или "X неделя Y урок" (с опциональным " - название")
        const match = entry.name.match(/^(\d+)\s+(апта|неделя)\s+(\d+)\s+(сабақ|урок)(?:\s*[-–]\s*(.+))?$/i);

        if (match) {
          lessons.push({
            name: entry.name,
            path: path.join(classPath, entry.name),
            week: parseInt(match[1]),
            lessonNumber: parseInt(match[3]),
            title: match[5]?.trim() || undefined
          });
        }
      }
    }

    // Сортировка по неделям и номеру урока
    lessons.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return a.lessonNumber - b.lessonNumber;
    });

  } catch (error) {
    console.error(`❌ Ошибка сканирования уроков в ${classPath}:`, error);
  }

  return lessons;
}