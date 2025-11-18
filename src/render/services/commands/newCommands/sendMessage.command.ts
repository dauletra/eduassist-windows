// src/render/services/commands/newCommands/sendMessage.command.ts
import type { Command } from '../CommandDispatcher';
import type { AppStore } from '../../../store';
import { MessagingService } from "../../domain/MessagingService";
import { FileService, type FileType } from "../../domain/FileService";

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

export const sendMessageCommand: Command = {
  type: 'SendMessage',

  execute: async (
    store: AppStore,
    params: Record<string, any>
  ) => {
    try {
      const fileService = new FileService(store);
      const messagingService = new MessagingService(store);

      const fileTypeRu = params.fileType?.toLowerCase();
      const fileType = fileTypeMap[fileTypeRu];
      const fileNumber = params.numberValue || 1;

      if (!fileType) {
        return {
          success: false,
          message: 'Файл түрі анықталмады'
        };
      }

      // Получить файл по типу и номеру
      const files = store.getState().lessonFiles;
      const file = fileService.getFileByTypeAndIndex(files, fileType, fileNumber);

      if (!file) {
        const typeNames: Record<FileType, string> = {
          presentation: 'презентация',
          video: 'видео',
          document: 'документ',
          task: 'тапсырма',
          link: 'сілтеме'
        };

        return {
          success: false,
          message: `${typeNames[fileType]} №${fileNumber} табылмады`
        };
      }

      // Отправить файл через MessagingService
      const result = await messagingService.sendFile(file.path);

      return {
        success: result.success,
        message: result.message
      };

    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Файл жіберу қатесі'
      };
    }
  }
};