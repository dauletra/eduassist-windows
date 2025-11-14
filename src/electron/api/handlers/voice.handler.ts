// src/electron/api/handlers/voice.handler.ts
import { ipcMain, BrowserWindow, app } from 'electron';
import { getModelPath, getModelUrl } from "../../utils/resource-path.js";
import { startWakeWord, stopWakeWord } from "../services/wakeword.service.js";
import path from 'path';
import fs from 'fs';

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
  });

  // Остановить запись
  ipcMain.handle('stop-recording', async () => {
    isRecording = false;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('recording-state-changed', false);
    }
  });

  // ✅ ИЗМЕНЕНИЕ: передаем callback, который отправит IPC событие
  ipcMain.handle("start-voice-listening", async () => {
    try {
      await startWakeWord(() => {
        // ✅ Callback вызывается когда wake word обнаружено
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send("voice:wakeword-detected");
        }
      });
    } catch (error) {
      console.error('❌ startWakeWord failed:', error);
      throw error;
    }
  });

  ipcMain.handle("stop-voice-listening", async () => {
    await stopWakeWord();
  });

  // Получить путь к модели (для production)
  ipcMain.handle('getModelPath', async (_, modelName: string) => {
    try {
      return getModelPath(modelName);
    } catch (error) {
      console.error('❌ getModelPath failed:', error);
      throw error;
    }
  });

  // Получить URL модели (для development)
  ipcMain.handle('getModelUrl', async (_, modelName: string) => {
    try {
      return getModelUrl(modelName);
    } catch (error) {
      console.error('❌ getModelUrl failed:', error);
      throw error;
    }
  });

  // Получить абсолютный путь к модели (универсальный метод)
  ipcMain.handle('get-model-file-path', async (_, modelName: string) => {
    try {
      let modelPath: string;

      if (app.isPackaged) {
        const resourcesPath = process.resourcesPath;
        modelPath = path.join(resourcesPath, 'resources', modelName);

        if (!fs.existsSync(modelPath)) {
          const altPath = path.join(resourcesPath, modelName);
          if (fs.existsSync(altPath)) {
            modelPath = altPath;
          } else {
            throw new Error(`Model file not found: ${modelName}`);
          }
        }
      } else {
        modelPath = path.join(process.cwd(), 'public', 'resources', modelName);

        if (!fs.existsSync(modelPath)) {
          const altPath = path.join(process.cwd(), 'resources', modelName);
          if (fs.existsSync(altPath)) {
            modelPath = altPath;
          } else {
            throw new Error(`Model file not found in development: ${modelName}`);
          }
        }
      }

      return modelPath;
    } catch (error) {
      console.error('❌ get-model-file-path failed:', error);
      throw error;
    }
  });
}

/**
 * Получить состояние записи
 */
export function getRecordingState(): boolean {
  return isRecording;
}