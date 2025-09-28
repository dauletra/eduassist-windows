// src/electron/utils/paths.ts

import { app } from 'electron';
import * as path from 'path';
import { isDev } from './dev-config.js'

/**
 * Получить путь к данным пользователя
 */
export function getUserDataPath(): string {
  // В production используем userData, в dev - downloads для удобства
  if (isDev()) {
    return path.join(app.getPath('downloads'), 'eduassist-windows-files');
  }

  return path.join(app.getPath('userData'), 'data');
}

/**
 * Пути к файлам данных
 */
export const DATA_PATHS = {
  root: () => getUserDataPath(),
  students: () => path.join(getUserDataPath(), 'students.json'),
  journal: () => path.join(getUserDataPath(), 'journal.json'),
  settings: () => path.join(getUserDataPath(), 'settings.json'),
  config: () => path.join(getUserDataPath(), 'config.json'),
  backups: () => path.join(getUserDataPath(), 'backups'),
  presentations: () => path.join(getUserDataPath(), 'presentations'),
  templates: () => path.join(getUserDataPath(), 'templates'),
} as const;