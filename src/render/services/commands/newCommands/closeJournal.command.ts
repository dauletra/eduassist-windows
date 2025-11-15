// src/render/services/commands/newCommands/closeJournal.command.ts

import type { Command, CommandResultWithState } from '../CommandDispatcher';
import type { AppStore } from '../../../store';

/**
 * Новая команда закрытия журнала
 */
export const closeJournalCommand: Command = {
  type: 'CloseJournal',

  async execute(store: AppStore, _params: Record<string, any>): Promise<CommandResultWithState> {
    console.log('📕 Closing journal');

    store.setState(prev => ({
      ...prev,
      currentClassId: null,
      currentGroupId: null,
      currentLessonId: null,
      lessons: [],
      selectedGroup: null
    }));

    return {
      success: true,
      message: 'Журнал закрыт'
    };
  }
};