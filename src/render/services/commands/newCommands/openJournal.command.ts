// src/render/services/commands/newCommands/openJournal.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { JournalService } from '../../domain/JournalService';

export const openJournalCommand: Command = {
  type: 'OpenJournal',
  async execute(store: AppStore, params: Record<string, any>) {
    const svc = new JournalService(store);
    const groupId = params.groupId ? String(params.groupId).trim() : undefined;

    if (groupId) {
      const parts = groupId.split('-');
      if (parts.length === 2) {
        const classPart = parts[0];
        params.classNumber = classPart.match(/\d+/)?.[0];
        params.classLetter = classPart.match(/[a-zA-Zа-яА-ЯәӘ]/)?.[0]?.toLowerCase() || '';
        params.groupNumber = parts[1];
      }
    }

    const classNumber = String(params.classNumber || '').trim();
    const classLetter = String(params.classLetter || '').trim().toLowerCase();
    const groupNumber = String(params.groupNumber || '').trim();

    if (!classNumber) return { success: false, message: 'Не указан номер класса' };
    if (!groupNumber) return { success: false, message: 'Не указан номер группы' };

    return svc.openJournal(classNumber, classLetter, groupNumber);
  }
};
