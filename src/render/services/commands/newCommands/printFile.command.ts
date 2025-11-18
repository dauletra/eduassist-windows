// src/render/services/commands/newCommands/printFile.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { FileService, type FileType } from "../../domain/FileService";

const fileTypeMap: Record<string, FileType> = {
  'тапсырма': 'task',
  'Тапсырма': 'task',
  'Тапсырманы': 'task',
  'тапсырманы': 'task',
  'Тапсырмаларды': 'task',
  'тапсырмаларды': 'task'
};

export const printFileCommand: Command = {
  type: 'PrintDocument',

  execute: async (
    store: AppStore,
    params: Record<string, any>
  ) => {
    try {
      const fileService = new FileService(store);

      const fileTypeRu = params.fileType?.toLowerCase();
      const fileType = fileTypeMap[fileTypeRu];
      const fileNumber = params.numberValue || 1;

      if (!fileType) {
        return {
          success: false,
          message: 'Файл түрі басып шығаруға келмейді. Тек PDF және Word құжаттарын басып шығаруға болады'
        };
      }

      // Получить файл по типу и номеру
      const files = store.getState().lessonFiles;
      const file = fileService.getFileByTypeAndIndex(files, fileType, fileNumber);

      if (!file) {
        const typeNames: Record<FileType, string> = {
          presentation: 'презентация',
          video: 'видео',
          document: 'құжат',
          task: 'тапсырма',
          link: 'сілтеме'
        };

        return {
          success: false,
          message: `${typeNames[fileType]} №${fileNumber} табылмады`
        };
      }

      // Печать через FileService
      const result = await fileService.printFile(file.path);

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Басып шығару қатесі'
      };
    }
  }
};