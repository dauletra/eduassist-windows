// src/render/services/commands/newCommands/closeFile.command.ts

import type { CommandResult } from '../types';
import { FileService } from '../../domain/FileService';
import {AppStore} from "../../../store";
import type {Command} from "../CommandDispatcher.ts";

const closeTypeMap: Record<string, 'presentation' | 'video'> = {
  'презентация': 'presentation',
  'презентацию': 'presentation',
  'видео': 'video'
};

export const closeFileCommand: Command = {
  type: 'CloseFile',
  // displayName: 'Закрыть файл',
  // description: 'Закрывает презентацию или видео',
  // requiresContext: false,

  // params: [
  //   {
  //     name: 'fileType',
  //     type: 'string',
  //     entityCategory: 'FileType',
  //     required: true,
  //     description: 'Тип файла для закрытия: презентация или видео',
  //     validate: (value: string) => {
  //       if (!closeTypeMap[value?.toLowerCase()]) {
  //         return 'Можно закрыть только презентацию или видео';
  //       }
  //       return true;
  //     }
  //   }
  // ],

  execute: async (
    store: AppStore,
    params: Record<string, any>
  ): Promise<CommandResult> => {
    try {
      const fileService = new FileService(store);
      const fileTypeRu = params.fileType?.toLowerCase();
      const closeType = closeTypeMap[fileTypeRu];

      let result;
      if (closeType === 'presentation') {
        result = await fileService.closePresentation();
      } else {
        result = await fileService.closeVideo();
      }

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
      console.error('❌ Ошибка выполнения команды CloseFile:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Ошибка закрытия файла'
      };
    }
  }
};