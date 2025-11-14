// src/electron/windows/main-window.ts

import { BrowserWindow, ipcMain, app } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getDevUrl, isDev } from '../utils/dev-config.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

/**
 * Создание главного окна приложения
 */
export function createMainWindow(): BrowserWindow {
  console.log('🏗️ createMainWindow вызван');
  const appTitle = isDev() ? 'EduAssist - AI-Maral (dev)' : 'EduAssist - AI-Maral';

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true,
    titleBarStyle: 'default',
    title: appTitle,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev()
        ? path.join(process.cwd(), 'dist-electron', 'preload.cjs')
        : path.join(__dirname, '..', 'preload.cjs'),
      webSecurity: true
    }
  });

  // Загружаем React приложение
  // loadMainWindowContent();

  // Настраиваем обработчики событий окна
  setupMainWindowEvents();

  console.log('🚀 Главное окно создано');

  return mainWindow;
}

/**
 * Загрузка контента в главное окно
 */
export function loadMainWindowContent(): void {
  if (!mainWindow) return;

  if (isDev()) {
    console.log('📡 Загружаю dev сервер:', getDevUrl());
    mainWindow.loadURL(getDevUrl());
    // mainWindow.webContents.openDevTools(); // Раскомментируйте для отладки

    console.log('@ __dirname', __dirname);
    console.log('@ app.getAppPath()', app.getAppPath());
    console.log('@ app.getPath(userData)', app.getPath('userData'));
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }
}

/**
 * Настройка обработчиков событий окна
 */
function setupMainWindowEvents(): void {
  if (!mainWindow) return;

  // Событие при готовности окна
  mainWindow.webContents.once('dom-ready', () => {
    console.log('🎯 DOM загружен');

    if (isDev()) {
      mainWindow?.webContents.send('dev-mode', true);
    }
  });

  // Перехват закрытия окна для сохранения данных
  mainWindow.on('close', (event) => {
    console.log('💾 Сохраняю состояние перед закрытием...', event);
    // TODO: Здесь можно добавить сохранение состояния приложения
  });

  // Событие когда окно закрыто
  mainWindow.on('closed', () => {
    console.log('👋 Окно закрыто');
    mainWindow = null;
  });

  // Обработка потери фокуса (для голосового ассистента может быть полезно)
  mainWindow.on('blur', () => {
    console.log('👁️ Окно потеряло фокус');
  });

  mainWindow.on('focus', () => {
    console.log('👁️ Окно получило фокус');
  });
}

/**
 * Получение главного окна
 */
export function getMainWindow(): BrowserWindow {
  if (!mainWindow) {
    throw new Error('Main window not initialized');
  }
  return mainWindow;
}

/**
 * Проверка существования главного окна
 */
export function hasMainWindow(): boolean {
  return mainWindow !== null && !mainWindow.isDestroyed();
}

/**
 * Закрытие главного окна
 */
export function closeMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.close();
    mainWindow = null;
  }
}

/**
 * Свернуть главное окно
 */
export function minimizeMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.minimize();
  }
}

/**
 * Отправить сообщение в главное окно
 */
export function sendToMainWindow(channel: string, ...args: any[]): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

/**
 * Перезагрузить главное окно
 */
export function reloadMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.reload();
  }
}

/**
 * Показать DevTools (только в dev режиме)
 */
export function toggleDevTools(): void {
  if (mainWindow && !mainWindow.isDestroyed() && isDev()) {
    if (mainWindow.webContents.isDevToolsOpened()) {
      mainWindow.webContents.closeDevTools();
    } else {
      mainWindow.webContents.openDevTools();
    }
  }
}