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
        message: `Открыт файл: ${file.name}`
      };
    } catch (e) {
      return {
        success: false,
        message: "Ошибка открытия файла"
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
      return { success: true, message: "Файл открыт" };
    } catch (e) {
      return { success: false, message: "Ошибка открытия файла" };
    }
  }

  async printFile(filePath: string) {
    try {
      await this.api.printFile(filePath);
      return { success: true, message: "Файл отправлен на печать" };
    } catch (e) {
      return { success: false, message: "Ошибка печати файла" };
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
      return { success: true, message: "Презентация закрыта" };
    } catch (e) {
      return { success: false, message: "Ошибка закрытия презентации" };
    }
  }

  async closeVideo() {
    try {
      await this.api.closeVideo();
      return { success: true, message: "Видео закрыто" };
    } catch (e) {
      return { success: false, message: "Ошибка закрытия видео" };
    }
  }
}