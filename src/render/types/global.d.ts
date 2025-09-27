// Импортируем общие типы
import type { IElectronAPI } from '../electron/shared-types';

// Глобальные типы для renderer процесса
declare global {
  interface Window {
    electronAPI: IElectronAPI;
    voiceAssistant: any;
    appState: any;
  }
}

// Экспортируем для использования в компонентах
export type { IElectronAPI };
