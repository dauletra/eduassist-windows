// src/electron/api/services/presentation.service.ts

import { shell, app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { spawn, ChildProcess } from 'child_process';
import type { PresentationConfig } from '../../shared-types.js';

interface OpenedFile {
  filePath: string;
  fileType: 'presentation' | 'video';
  process: ChildProcess;
  pid: number;
}

/**
 * Сервис для работы с презентациями и видео
 */
export class PresentationService {
  private presentations: Record<string, PresentationConfig> = {};
  private openedFiles: Map<string, OpenedFile> = new Map();

  /**
   * Определить тип файла по расширению
   */
  private getFileType(filePath: string): 'presentation' | 'video' | null {
    const ext = path.extname(filePath).toLowerCase();
    if (['.pptx', '.ppt'].includes(ext)) return 'presentation';
    if (['.mp4', '.avi', '.mov'].includes(ext)) return 'video';
    return null;
  }

  /**
   * Открыть презентацию или видео с отслеживанием процесса
   */
  async openPresentation(filePath: string): Promise<void> {
    try {
      const fileType = this.getFileType(filePath);

      if (fileType) {
        // Открываем через spawn для отслеживания процесса
        const childProcess = spawn('cmd', ['/c', 'start', '', filePath], {
          detached: true,
          stdio: 'ignore'
        });

        const pid = childProcess.pid;
        if (pid) {
          this.openedFiles.set(filePath, {
            filePath,
            fileType,
            process: childProcess,
            pid
          });

          console.log(`✅ Файл открыт с PID ${pid}: ${filePath}`);

          // Отслеживаем закрытие процесса
          childProcess.on('exit', () => {
            this.openedFiles.delete(filePath);
            console.log(`📪 Файл закрыт: ${filePath}`);
          });

          childProcess.unref();
        }
      } else {
        // Для других типов файлов используем обычное открытие
        const result = await shell.openPath(filePath);
        if (result) {
          console.error(`❌ Ошибка открытия файла: ${result}`);
          throw new Error(result);
        }
        console.log(`✅ Файл открыт: ${filePath}`);
      }
    } catch (error) {
      console.error('❌ Ошибка открытия файла:', error);
      throw error;
    }
  }

  /**
   * Закрыть презентацию
   */
  async closePresentation(): Promise<void> {
    const presentations = Array.from(this.openedFiles.values())
      .filter(f => f.fileType === 'presentation');

    if (presentations.length === 0) {
      throw new Error('Нет открытых презентаций');
    }

    // Закрываем последнюю открытую презентацию
    const last = presentations[presentations.length - 1];
    this.closeFile(last);
    console.log(`✅ Презентация закрыта: ${last.filePath}`);
  }

  /**
   * Закрыть видео
   */
  async closeVideo(): Promise<void> {
    const videos = Array.from(this.openedFiles.values())
      .filter(f => f.fileType === 'video');

    if (videos.length === 0) {
      throw new Error('Нет открытых видео');
    }

    // Закрываем последнее открытое видео
    const last = videos[videos.length - 1];
    this.closeFile(last);
    console.log(`✅ Видео закрыто: ${last.filePath}`);
  }

  /**
   * Закрыть файл по процессу
   */
  private closeFile(openedFile: OpenedFile): void {
    try {
      if (process.platform === 'win32') {
        // Windows: используем taskkill
        spawn('taskkill', ['/PID', openedFile.pid.toString(), '/F'], {
          detached: true,
          stdio: 'ignore'
        });
      } else {
        // Unix-like: используем kill
        openedFile.process.kill('SIGTERM');
      }

      this.openedFiles.delete(openedFile.filePath);
    } catch (error) {
      console.error('❌ Ошибка закрытия файла:', error);
      throw error;
    }
  }

  /**
   * Получить список открытых файлов
   */
  getOpenedFiles(): OpenedFile[] {
    return Array.from(this.openedFiles.values());
  }

  /**
   * Открыть файл презентации
   */
  private async openPresentationFile(presentation: PresentationConfig): Promise<void> {
    const userDataPath = app.getPath('userData');

    // Возможные пути к файлу
    const possiblePaths = [
      path.join(userDataPath, 'presentations', path.basename(presentation.path)),
      path.join(userDataPath, presentation.path),
      path.join(process.cwd(), presentation.path)
    ];

    // Пытаемся найти и открыть файл
    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        await this.openPresentation(fullPath);
        return;
      }
    }
  }

  /**
   * Получить список всех презентаций
   */
  getAllPresentations(): PresentationConfig[] {
    return Object.values(this.presentations);
  }

  /**
   * Добавить презентацию
   */
  addPresentation(key: string, presentation: PresentationConfig): void {
    this.presentations[key.toLowerCase()] = presentation;
  }
}

// Экспорт единственного экземпляра (singleton)
export const presentationService = new PresentationService();