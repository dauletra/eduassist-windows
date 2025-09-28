import { ipcMain, BrowserWindow } from 'electron';
import { backupService } from '../services/backup.service.js';

/**
 * Регистрация обработчиков управления окнами
 */
export function registerWindowHandlers(mainWindow: BrowserWindow): void {

  // Свернуть окно
  ipcMain.handle('minimize-window', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.minimize();
      console.log('🔽 Окно свернуто');
    }
  });

  // Закрыть окно
  ipcMain.handle('close-window', async () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      const backupPath = backupService.createBackup();
      if (backupPath) {
        console.log('💾 Резервная копия создана:', backupPath);
      }

      mainWindow.close();
      console.log('❌ Окно закрыто');
    }
  });

  console.log('🪟 Window handlers зарегистрированы');
}