// src/electron/api/index.ts

import { BrowserWindow } from 'electron';
import { initService } from './services/init.service.js';
import { backupService } from './services/backup.service.js';

import { registerSettingsHandlers } from './handlers/settings.handler.js';
import { registerLessonHandlers } from './handlers/lesson.handler.js';
import { registerStudentHandlers } from './handlers/student.handler.js';
import { registerTeacherHandlers } from './handlers/teacher.handler.js';
import { registerWindowHandlers } from './handlers/window.handler.js';
import { registerVoiceHandlers } from './handlers/voice.handler.js';
import {registerLessonPlansHandlers} from "./handlers/lesson-plans.handler.js";

/**
 * Инициализация и регистрация всех IPC обработчиков
 */
export function setupElectronAPI(mainWindow: BrowserWindow): void {
  console.log('🔧 Инициализация Electron API...');

  // Инициализация структуры данных
  initService.initialize();

  // Регистрация всех обработчиков
  registerSettingsHandlers();
  registerLessonHandlers();
  registerLessonPlansHandlers()
  registerStudentHandlers();
  registerTeacherHandlers();
  registerWindowHandlers(mainWindow);
  registerVoiceHandlers(mainWindow);

  // Очистка старых резервных копий
  backupService.cleanupOldBackups()

  console.log('✅ Electron API инициализирован');
}

// Реэкспорт для обратной совместимости
export { getRecordingState } from './handlers/voice.handler.js';