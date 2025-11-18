// src/render/services/domain/FileService.ts
import { ElectronAdapter } from "./ElectronAdapter";
import type { FileItem } from "../../types";
import { AppStore } from "../../store";

export type FileType = 'presentation' | 'video' | 'document' | 'task' | 'link';

export class FileService {
  private api: ElectronAdapter;
  private store: AppStore;

  constructor(store: AppStore, api = new ElectronAdapter()) {
    this.api = api;
    this.store = store;
  }

  /**
   * Категоризировать файлы по типам
   */
  categorizeFiles(files: FileItem[]): Record<FileType, FileItem[]> {
    const categories: Record<FileType, FileItem[]> = {
      presentation: [],
      video: [],
      document: [],
      task: [],
      link: []
    };

    files.forEach(file => {
      const ext = (file.extension || '').toLowerCase();

      if (['.pptx', '.ppt'].includes(ext)) {
        categories.presentation.push(file);
      } else if (['.mp4', '.avi', '.mov'].includes(ext)) {
        categories.video.push(file);
      } else if (['.docx', '.doc'].includes(ext)) {
        categories.document.push(file);
      } else if (ext === '.pdf') {
        categories.task.push(file);
      } else if (ext === '.url') {
        categories.link.push(file);
      }
    });

    return categories;
  }

  /**
   * Получить файл по типу и индексу
   */
  getFileByTypeAndIndex(
    files: FileItem[],
    fileType: FileType,
    index: number = 1
  ): FileItem | null {
    const categories = this.categorizeFiles(files);
    const filesOfType = categories[fileType];

    if (!filesOfType || filesOfType.length === 0) {
      return null;
    }

    // index начинается с 1 (для пользователя), но массив с 0
    const arrayIndex = index - 1;

    if (arrayIndex < 0 || arrayIndex >= filesOfType.length) {
      return null;
    }

    return filesOfType[arrayIndex];
  }

  /**
   * Запустить презентацию в режиме слайдшоу
   */
  async startPresentation(index: number = 1): Promise<{ success: boolean; message: string }> {
    const files = this.store.getState().lessonFiles;
    const file = this.getFileByTypeAndIndex(files, 'presentation', index);

    if (!file) {
      return {
        success: false,
        message: `№${index} презентация табылмады`
      };
    }

    try {
      await this.api.startPresentation(file.path);
      return {
        success: true,
        message: `Презентация ${file.name} ашылды`
      };
    } catch (e) {
      return {
        success: false,
        message: "Презентацияны ашу кезінде қате пайда болды"
      };
    }
  }

  /**
   * Открыть файл по типу и индексу
   */
  async openFileByType(
    files: FileItem[],
    fileType: FileType,
    index: number = 1
  ): Promise<{ success: boolean; message: string }> {
    const file = this.getFileByTypeAndIndex(files, fileType, index);

    if (!file) {
      const typeNames: Record<FileType, string> = {
        presentation: 'презентация',
        video: 'видео',
        document: 'документ',
        task: 'задание',
        link: 'ссылка'
      };

      return {
        success: false,
        message: `${typeNames[fileType]} №${index} не найден${fileType === 'presentation' || fileType === 'link' ? 'а' : ''}`
      };
    }

    try {
      if (fileType === 'link') {
        await this.api.openUrlFile(file.path);
      } else {
        await this.api.openFile(file.path);
      }

      return {
        success: true,
        message: `${file.name} файлы ашылды`
      };
    } catch (e) {
      return {
        success: false,
        message: "Файлды ашу кезінде қате пайда болды"
      };
    }
  }

  async openFileFromStore(fileType: FileType, index: number = 1) {
    const files = this.store.getState().lessonFiles;
    return this.openFileByType(files, fileType, index);
  }

  async openFile(filePath: string) {
    try {
      await this.api.openFile(filePath);
      return { success: true, message: "Файл ашылды" };
    } catch (e) {
      return { success: false, message: "Файлды ашу кезінде қате кетті" };
    }
  }

  async printFile(filePath: string) {
    try {
      await this.api.printFile(filePath);
      return { success: true, message: "Тапсырма басып шығаруға жіберілді" };
    } catch (e) {
      return { success: false, message: "Басып шығару кезінде қате кетті" };
    }
  }

  async closeFile(fileType: 'presentation' | 'video') {
    if (fileType === 'presentation') {
      return this.closePresentation();
    } else {
      return this.closeVideo();
    }
  }

  async closePresentation() {
    try {
      await this.api.closePresentation();
      return { success: true, message: "Презентация жабылды" };
    } catch (e) {
      return { success: false, message: "Презентацияны жабу кезінде қате кетті" };
    }
  }

  async closeVideo() {
    try {
      await this.api.closeVideo();
      return { success: true, message: "Видео жабылды" };
    } catch (e) {
      return { success: false, message: "Видеоны жабу кезінде қате кетті" };
    }
  }
}