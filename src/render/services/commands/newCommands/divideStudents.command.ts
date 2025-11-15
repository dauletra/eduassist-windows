// src/render/services/commands/newCommands/divideStudents.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { GroupService } from '../../domain/GroupService';
import { commandEventBus } from '../../CommandEventBus.ts';

export const divideByGroupCountCommand: Command = {
  type: 'DivideByGroupCount',
  async execute(store: AppStore, params: Record<string, any>) {
    const svc = new GroupService(store);
    const count = Number(params.numberValue ?? params.count);
    const onlyPresent = params.onlyPresent !== false;
    const result = svc.divideByCount(count, onlyPresent);

    if (result.success) {
      commandEventBus.emit('groups_formed', result.data);
    }
    return result;
  }
};

export const divideByGroupSizeCommand: Command = {
  type: 'DivideByGroupSize',
  async execute(store: AppStore, params: Record<string, any>) {
    const svc = new GroupService(store);
    const size = Number(params.numberValue ?? params.size);
    const onlyPresent = params.onlyPresent !== false;
    const result = svc.divideBySize(size, onlyPresent);

    if (result.success) {
      commandEventBus.emit('groups_formed', result.data);
    }
    return result;
  }
};
