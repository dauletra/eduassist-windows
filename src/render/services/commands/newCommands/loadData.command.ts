// src/render/services/commands/newCommands/loadData.command.ts

import type { Command, CommandResultWithState } from '../CommandDispatcher';
import type { AppStore } from '../../../store';

/**
 * Новая команда загрузки данных классов
 */
export const loadDataCommand: Command = {
  type: 'LoadData',

  async execute(store: AppStore, _params: Record<string, any>): Promise<CommandResultWithState> {
    try {
      store.setState(prev => ({ ...prev, loading: true, error: null }));

      // Загружаем классы из students.json
      const studentsList = await window.electronAPI.loadStudentsList();

      store.setState(prev => ({
        ...prev,
        classes: studentsList,
        loading: false
      }));

      console.log('✅ Classes loaded:', studentsList.length);

      return {
        success: true,
        message: `Загружено ${studentsList.length} классов`
      };

    } catch (error) {
      console.error('❌ Failed to load data:', error);

      store.setState(prev => ({
        ...prev,
        error: 'Не удалось загрузить данные классов',
        classes: [],
        loading: false
      }));

      return {
        success: false,
        message: 'Не удалось загрузить данные классов'
      };
    }
  }
};