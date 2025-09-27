import { BrowserWindow } from "electron";
import * as path from 'path';
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let settingsWindow: BrowserWindow | null = null;

/**
 * Проверка режима разработки
 */
function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Создание окна настроек
 */
export function createSettingsWindow(parentWindow: BrowserWindow): void {
  // Если окно уже открыто, просто показываем его
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
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
        : path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    }
  });

  // Загружаем страницу настроек
  if (isDev()) {
    settingsWindow.loadURL('http://localhost:5123/settings.html');
    settingsWindow.webContents.openDevTools();
  } else {
    settingsWindow.loadFile(path.join(__dirname, '../dist-react/settings.html'));
  }

  // События окна настроек
  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });

  console.log('⚙️ Окно настроек создано')
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
 * Проверка открыто ли окно настроек
 */
export function isSettingsWindowOpen(): boolean {
  return settingsWindow !== null && !settingsWindow.isDestroyed();
}

/**
 * Получить окно настроек
 */
export function getSettingsWindow(): BrowserWindow | null {
  return settingsWindow;
}