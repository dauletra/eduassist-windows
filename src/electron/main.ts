import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { setupElectronAPI } from './api-handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow;

/**
 * Создание главного окна приложения
 */
function createMainWindow(): void {
  const appTitle = isDev() ? 'EduAssist - AI-Maral (dev)' : 'EduAssist - AI-Maral';
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    autoHideMenuBar: true, // Убираем меню File | Edit | View | Window
    titleBarStyle: 'default',
    title: appTitle,
    // icon: path.join(__dirname, '../assets/icon.png'), // TODO: Добавить иконку
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: isDev()
        ? path.join(process.cwd(), 'src', 'electron', 'preload.cjs')
        : path.join(__dirname, 'preload.cjs'),
      webSecurity: true
    }
  });

  // Загружаем React приложение
  if (isDev()) {
    mainWindow.loadURL('http://localhost:5123');
    // mainWindow.webContents.openDevTools(); // Отладка в dev режиме
    console.log('@ __dirname', __dirname);
    console.log('@ app.getAppPath()', app.getAppPath());
    console.log('@ app.getAppPath(userData)', app.getPath('userData'));
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
  }

  // Настраиваем обработчики событий окна
  setupWindowEvents();

  // Инициализируем API после создания окна
  setupElectronAPI(mainWindow);
  
  console.log('🚀 Главное окно создано');
}

/**
 * Настройка обработчиков событий окна
 */
function setupWindowEvents(): void {
  // Событие при готовности окна
  mainWindow.webContents.once('dom-ready', () => {
    console.log('🎯 DOM загружен');
    
    // Можно добавить начальные настройки
    if (isDev()) {
      mainWindow.webContents.send('dev-mode', true);
    }
  });

  // Перехват закрытия окна для сохранения данных
  mainWindow.on('close', (event) => {
    // TODO: Здесь можно добавить сохранение состояния приложения
    console.log('💾 Сохраняю состояние перед закрытием...', event);
  });

  // Событие когда окно закрыто
  mainWindow.on('closed', () => {
    console.log('👋 Окно закрыто');
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
 * Проверка режима разработки
 */
function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

// ==================== Жизненный цикл приложения ====================

/**
 * Приложение готово к запуску
 */
app.whenReady().then(async () => {
  console.log('⚡ Electron приложение готово');
  createMainWindow();
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
    createMainWindow();
  }
});

/**
 * Перед выходом из приложения
 */
app.on('before-quit', () => {
  console.log('📝 Подготовка к выходу из приложения...');
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
 * Получение главного окна (для использования в api-handlers.ts)
 */
export function getMainWindow(): BrowserWindow {
  return mainWindow;
}

/**
 * Проверка готовности приложения
 */
export function isAppReady(): boolean {
  return app.isReady();
}

console.log('🎯 Main процесс инициализирован');
