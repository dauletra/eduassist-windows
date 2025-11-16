import type { CommandResult } from '../types';
import { FileService, type FileType } from '../../domain/FileService';
import { AppStore } from '../../../store';
import type {Command} from "../CommandDispatcher.ts";

const fileTypeMap: Record<string, FileType> = {
  'презентация': 'presentation',
  'презентацию': 'presentation',
  'видео': 'video',
  'документ': 'document',
  'задание': 'task',
  'ссылка': 'link',
  'ссылку': 'link'
};

export const openFileCommand: Command = {
  type: 'OpenFile',
  // displayName: 'Открыть файл',
  // description: 'Открывает файл по типу и порядковому номеру',
  // requiresContext: true,

  // params: [
  //   { name: 'fileType', type: 'string', entityCategory: 'FileType', required: true },
  //   { name: 'fileNumber', type: 'number', entityCategory: 'NumberValue', required: false, default: 1 }
  // ],

  execute: async (
    store: AppStore,
    params: Record<string, any>
  ): Promise<CommandResult> => {
    try {
      const fileService = new FileService(store);
      const fileTypeRu = params.fileType?.toLowerCase();
      const fileType = fileTypeMap[fileTypeRu];
      const fileNumber = params.fileNumber || 1;

      const result = await fileService.openFileFromStore(fileType, fileNumber);

      return { success: result.success, message: result.message };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Ошибка открытия файла' };
    }
  }
};
