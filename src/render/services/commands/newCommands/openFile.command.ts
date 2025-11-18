import type { CommandResult } from '../types';
import { FileService, type FileType } from '../../domain/FileService';
import { AppStore } from '../../../store';
import type {Command} from "../CommandDispatcher.ts";

const fileTypeMap: Record<string, FileType> = {
  'презентация': 'presentation',
  'Презентация': 'presentation',
  'Презентацияны': 'presentation',
  'видео': 'video',
  'Видео': 'video',
  'Видеоны': 'video',
  'документ': 'document',
  'Тапсырма': 'task',
  'тапсырма': 'task',
  'Тапсырманы': 'task',
  'тапсырманы': 'task',
  'Тапсырмаларды': 'task',
  'тапсырмаларды': 'task',
  'Сілтеме': 'link',
  'сілтеме': 'link',
  'Сілтемеге': 'link',
  'сілтемеге': 'link',
  'Сілтемені': 'link',
  'сілтемені': 'link',
};

export const openFileCommand: Command = {
  type: 'OpenFile',

  execute: async (
    store: AppStore,
    params: Record<string, any>
  ): Promise<CommandResult> => {
    try {
      const fileService = new FileService(store);
      const fileTypeRu = params.fileType?.toLowerCase();
      const fileType = fileTypeMap[fileTypeRu];
      const fileNumber = params.numberValue || 1;

      let result = { success: false, message: '' };

      if (fileType === 'presentation') {
        // result = await fileService.startPresentation(fileNumber);
        result = await fileService.openFileFromStore(fileType, fileNumber);

      } else {
        result = await fileService.openFileFromStore(fileType, fileNumber);
      }

      return { success: result.success, message: result.message };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : 'Ошибка открытия файла' };
    }
  }
};
