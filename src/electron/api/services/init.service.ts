// src/electron/api/services/init.service.ts

import * as fs from 'fs';
import { DATA_PATHS } from '../../utils/paths.js';
import { ensureDirectoryExists, writeJsonFile } from '../../utils/file-utils.js';
import { defaultConfig } from '../../config.js';

/**
 * Сервис для инициализации структуры данных
 */
export class InitService {

  /**
   * Инициализация структуры данных при первом запуске
   */
  initialize(): void {
    console.log('🔧 Инициализация структуры данных...');

    // Создаем необходимые директории
    ensureDirectoryExists(DATA_PATHS.root());
    ensureDirectoryExists(DATA_PATHS.backups());
    ensureDirectoryExists(DATA_PATHS.presentations());
    ensureDirectoryExists(DATA_PATHS.templates());

    // Создаем файлы с данными по умолчанию, если их нет
    if (!fs.existsSync(DATA_PATHS.config())) {
      writeJsonFile(DATA_PATHS.config(), defaultConfig);
      console.log('✅ Создан файл конфигурации');
    }

    if (!fs.existsSync(DATA_PATHS.students())) {
      writeJsonFile(DATA_PATHS.students(), []);
      console.log('✅ Создан файл студентов');
    }

    if (!fs.existsSync(DATA_PATHS.journal())) {
      writeJsonFile(DATA_PATHS.journal(), []);
      console.log('✅ Создан файл журнала');
    }

    console.log('✅ Инициализация завершена');
  }

  /**
   * Проверить целостность данных
   */
  checkIntegrity(): boolean {
    const requiredFiles = [
      DATA_PATHS.config(),
      DATA_PATHS.students(),
      DATA_PATHS.journal()
    ];

    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));

    if (missingFiles.length > 0) {
      console.warn('⚠️ Отсутствуют файлы:', missingFiles);
      return false;
    }

    return true;
  }

  /**
   * Сброс данных (осторожно!)
   */
  reset(): void {
    console.warn('⚠️ СБРОС ВСЕХ ДАННЫХ');

    writeJsonFile(DATA_PATHS.config(), defaultConfig);
    writeJsonFile(DATA_PATHS.students(), []);
    writeJsonFile(DATA_PATHS.journal(), []);

    console.log('✅ Данные сброшены к начальным значениям');
  }
}

export const initService = new InitService();