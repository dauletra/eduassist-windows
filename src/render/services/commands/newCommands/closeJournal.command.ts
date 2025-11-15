// src/render/services/commands/newCommands/closeJournal.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { JournalService } from '../../domain/JournalService';

export const closeJournalCommand: Command = {
  type: 'CloseJournal',
  async execute(store: AppStore) {
    const svc = new JournalService(store);
    return svc.closeJournal();
  }
};
