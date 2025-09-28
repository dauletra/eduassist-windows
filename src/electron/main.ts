// src/electron/main.ts

import { app, BrowserWindow, ipcMain } from 'electron';
import { setupElectronAPI } from './api/index.js';
import { createMainWindow, getMainWindow, sendToMainWindow } from './windows/main-window.js';
import { createSettingsWindow } from './windows/settings-window.js';
import { lessonService } from './api/services/lesson.service.js';
import { isDev } from './utils/dev-config.js'

// ==================== ВАЖНО: Настройки ДО app.ready() ====================

// Отключаем GPU в dev режиме для избежания ошибок кэша
if (isDev()) {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch('--disable-gpu');
  app.commandLine.appendSwitch('--disable-software-rasterizer');
  app.commandLine.appendSwitch('--disable-gpu-compositing');
}

// ==================== Обработчики окон ====================

/**
 * Настройка обработчиков окон
 */
function setupWindowHandlers(): void {
  // Обработчик открытия окна настроек
  ipcMain.handle('open-settings-window', () => {
    const mainWindow = getMainWindow();
    createSettingsWindow(mainWindow);
  });

  // Обработчик уведомлений от окна настроек к главному окну
  ipcMain.on('notify-main-window', (_event, channel: string) => {
    if (channel === 'settings-updated') {
      sendToMainWindow('settings-updated');
    }
  });
}

// ==================== Жизненный цикл приложения ====================

/**
 * Приложение готово к запуску
 */
app.whenReady().then(async () => {
  console.log('⚡ Electron приложение готово');

  const mainWindow = createMainWindow();

  // Инициализируем API после создания окна
  setupElectronAPI(mainWindow);

  // Настраиваем обработчики окон
  setupWindowHandlers();
});

/**
 * Все окна закрыты
 */
app.on('window-all-closed', () => {
  console.log('🔚 Все окна закрыты');

  // На macOS приложения остаются активными даже после закрытия всех окон
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Приложение активировано (актуально для macOS)
 */
app.on('activate', () => {
  console.log('🔄 Приложение активировано');

  // На macOS пересоздаем окно при клике на иконку в доке
  if (BrowserWindow.getAllWindows().length === 0) {
    const mainWindow = createMainWindow();
    setupElectronAPI(mainWindow);
    setupWindowHandlers();
  }
});

/**
 * Перед выходом из приложения
 */
app.on('before-quit', () => {
  console.log('📝 Подготовка к выходу из приложения...');

  // Принудительно сохраняем все изменения
  lessonService.flushUpdates();

  // TODO: Здесь можно добавить финальную очистку ресурсов
});

/**
 * Обработка некорректного завершения
 */
process.on('uncaughtException', (error) => {
  console.error('💥 Некорректное завершение:', error);
  // TODO: Можно добавить отправку ошибки в систему мониторинга
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚫 Необработанное отклонение Promise:', reason, promise);
});

// ==================== Экспорт для использования в других файлах ====================

/**
 * Проверка готовности приложения
 */
export function isAppReady(): boolean {
  return app.isReady();
}

console.log('🎯 Main процесс инициализирован');