// src/render/services/commands/newCommands/loadData.command.ts

import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { DataService } from '../../domain/DataService';

/**
 * Команда загрузки данных классов при старте приложения
 */
export const loadDataCommand: Command = {
  type: 'LoadData',

  async execute(store: AppStore, _params: Record<string, any>) {
    const service = new DataService(store);
    return service.loadClasses();
  }
};