// src/render/services/commands/newCommands/updateAttendance.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { AttendanceService } from '../../domain/AttendanceService';

export const updateAttendanceCommand: Command = {
  type: 'UpdateAttendance',
  async execute(store: AppStore, params: Record<string, any>) {
    const svc = new AttendanceService(store);
    const idOrName = params.studentId ?? params.studentName;
    return svc.setAttendance(idOrName, !!params.attendance);
  }
};
