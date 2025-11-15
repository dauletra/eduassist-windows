// src/render/services/commands/newCommands/setGrade.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { GradeService } from '../../domain/GradeService';

export const setGradeCommand: Command = {
  type: 'SetGrade',
  async execute(store: AppStore, params: Record<string, any>) {
    const service = new GradeService(store);
    const idOrName = params.StudentName ?? params.studentName ?? params.studentId;
    return service.setGrade(idOrName, params.NumberValue ?? params.numberValue ?? null);
  }
};
