// src/electron/api/services/config.service.ts

import type { AppConfig } from '../../shared-types.js';
import { defaultConfig } from '../../config.js';
import { DATA_PATHS } from '../../utils/paths.js';
import { readJsonFile, writeJsonFile } from '../../utils/file-utils.js';

/**
 * Сервис для работы с конфигурацией
 */
export class ConfigService {

  /**
   * Загрузить конфигурацию приложения
   */
  loadConfig(): AppConfig {
    return readJsonFile(DATA_PATHS.config(), defaultConfig);
  }

  /**
   * Сохранить конфигурацию приложения
   */
  saveConfig(config: AppConfig): boolean {
    return writeJsonFile(DATA_PATHS.config(), config);
  }

  /**
   * Обновить часть конфигурации
   */
  updateConfig(updates: Partial<AppConfig>): boolean {
    const currentConfig = this.loadConfig();
    const updatedConfig = { ...currentConfig, ...updates };
    return this.saveConfig(updatedConfig);
  }
}

export const configService = new ConfigService();