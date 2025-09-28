// src/electron/windows/settings-window.ts

import { BrowserWindow, app } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { getDevUrl, isDev } from '../utils/dev-config.js'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let settingsWindow: BrowserWindow | null = null;

/**
 * Создание окна настроек
 */
export function createSettingsWindow(parentWindow: BrowserWindow): BrowserWindow {
  // Если окно уже открыто, просто показываем его
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 950,
    height: 650,
    minWidth: 800,
    minHeight: 600,
    parent: parentWindow,
    modal: false,
    autoHideMenuBar: true,
    title: 'Настройки - EduAssist',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev()
        ? path.join(process.cwd(), 'src', 'electron', 'preload.cjs')
        : path.join(__dirname, '..', 'preload.cjs'),
      webSecurity: true
    }
  });

  // Загружаем страницу настроек
  loadSettingsWindowContent();

  // Настраиваем события окна
  setupSettingsWindowEvents();

  console.log('⚙️ Окно настроек создано');

  return settingsWindow;
}

/**
 * Загрузка контента в окно настроек
 */
function loadSettingsWindowContent(): void {
  if (!settingsWindow) return;

  if (isDev()) {
    console.log('📡 Загружаю настройки (dev):', getDevUrl('/settings.html'));
    settingsWindow.loadURL(getDevUrl('/settings.html'));
    // settingsWindow.webContents.openDevTools();
  } else {
    const settingsPath = path.join(app.getAppPath(), '/dist-react/settings.html');
    console.log('📁 Загружаю настройки (prod):', settingsPath);
    settingsWindow.loadFile(settingsPath);
  }
}

/**
 * Настройка событий окна настроек
 */
function setupSettingsWindowEvents(): void {
  if (!settingsWindow) return;

  settingsWindow.on('closed', () => {
    console.log('⚙️ Окно настроек закрыто');
    settingsWindow = null;
  });

  settingsWindow.webContents.once('dom-ready', () => {
    console.log('🎯 DOM настроек загружен');
  });
}

/**
 * Получение окна настроек
 */
export function getSettingsWindow(): BrowserWindow {
  if (!settingsWindow) {
    throw new Error('Settings window not initialized');
  }
  return settingsWindow;
}

/**
 * Проверка существования окна настроек
 */
export function hasSettingsWindow(): boolean {
  return settingsWindow !== null && !settingsWindow.isDestroyed();
}

/**
 * Закрытие окна настроек
 */
export function closeSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.close();
    settingsWindow = null;
  }
}

/**
 * Показать окно настроек
 */
export function showSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
  }
}

/**
 * Скрыть окно настроек
 */
export function hideSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.hide();
  }
}

/**
 * Отправить сообщение в окно настроек
 */
export function sendToSettingsWindow(channel: string, ...args: any[]): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send(channel, ...args);
  }
}