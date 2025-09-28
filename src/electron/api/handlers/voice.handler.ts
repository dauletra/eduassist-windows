import { ipcMain, BrowserWindow } from 'electron';

let isRecording = false;

/**
 * Регистрация обработчиков голосовых команд
 */
export function registerVoiceHandlers(mainWindow: BrowserWindow): void {

  // Начать запись
  ipcMain.handle('start-recording', async () => {
    isRecording = true;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('recording-state-changed', true);
    }

    console.log('🎤 Запись начата');
  });

  // Остановить запись
  ipcMain.handle('stop-recording', async () => {
    isRecording = false;

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('recording-state-changed', false);
    }

    console.log('🎤 Запись остановлена');
  });

  console.log('🎙️ Voice handlers зарегистрированы');
}

/**
 * Получить состояние записи
 */
export function getRecordingState(): boolean {
  return isRecording;
}