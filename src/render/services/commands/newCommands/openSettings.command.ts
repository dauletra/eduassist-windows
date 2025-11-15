// src/render/services/commands/newCommands/openSettings.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { ElectronAdapter } from '../../domain/ElectronAdapter';

export const openSettingsCommand: Command = {
  type: 'OpenSettings',
  async execute(_store: AppStore, _params: Record<string, any>) {
    const api = new ElectronAdapter();

    try {
      await api.openSettingsWindow();
      return { success: true, message: 'Окно настроек открыто' };
    } catch (error) {
      console.error('Ошибка открытия настроек:', error);
      return {
        success: false,
        message: 'Не удалось открыть окно настроек'
      };
    }
  }
};