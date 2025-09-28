// src/electron/utils/file-utils.ts

import * as fs from 'fs';
import * as path from 'path';

/**
 * Создать директорию, если она не существует
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Безопасное чтение JSON файла
 */
export function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`❌ Ошибка чтения файла ${filePath}:`, error);
  }

  return defaultValue;
}

/**
 * Безопасная запись JSON файла
 */
export function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи файла ${filePath}:`, error);
    return false;
  }
}

/**
 * Проверить существование файла
 */
export function fileExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}