// src/electron/api/services/backup.service.ts

import * as fs from 'fs';
import * as path from 'path';
import { DATA_PATHS } from '../../utils/paths.js';
import { ensureDirectoryExists } from '../../utils/file-utils.js';
import { configService } from './config.service.js';
import { studentService } from './student.service.js';
import { lessonService } from './lesson.service.js';

/**
 * Сервис для резервного копирования
 */
export class BackupService {

  /**
   * Создать резервную копию данных
   */
  createBackup(): string | null {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupDir = DATA_PATHS.backups();
      ensureDirectoryExists(backupDir);

      const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        config: configService.loadConfig(),
        students: studentService.loadStudentsList(),
        journal: lessonService.loadJournal()
      };

      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');

      console.log(`💾 Резервная копия создана: ${backupFile}`);
      return backupFile;

    } catch (error) {
      console.error('❌ Ошибка создания резервной копии:', error);
      return null;
    }
  }

  /**
   * Очистка старых резервных копий (оставляем только последние N)
   */
  cleanupOldBackups(keepCount: number = 10): void {
    try {
      const backupDir = DATA_PATHS.backups();

      if (!fs.existsSync(backupDir)) {
        return;
      }

      const files = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          stats: fs.statSync(path.join(backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      const filesToDelete = files.slice(keepCount);

      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`🗑️ Удалена старая резервная копия: ${file.name}`);
      });

      if (filesToDelete.length > 0) {
        console.log(`✅ Очищено ${filesToDelete.length} старых копий`);
      }

    } catch (error) {
      console.error('❌ Ошибка очистки резервных копий:', error);
    }
  }

  /**
   * Получить список всех резервных копий
   */
  listBackups(): Array<{ name: string; date: Date; size: number }> {
    try {
      const backupDir = DATA_PATHS.backups();

      if (!fs.existsSync(backupDir)) {
        return [];
      }

      return fs.readdirSync(backupDir)
        .filter(file => file.startsWith('backup-') && file.endsWith('.json'))
        .map(file => {
          const stats = fs.statSync(path.join(backupDir, file));
          return {
            name: file,
            date: stats.mtime,
            size: stats.size
          };
        })
        .sort((a, b) => b.date.getTime() - a.date.getTime());

    } catch (error) {
      console.error('❌ Ошибка получения списка копий:', error);
      return [];
    }
  }

  /**
   * Восстановить из резервной копии
   */
  restoreFromBackup(backupFileName: string): boolean {
    try {
      const backupPath = path.join(DATA_PATHS.backups(), backupFileName);

      if (!fs.existsSync(backupPath)) {
        console.error('❌ Файл резервной копии не найден');
        return false;
      }

      const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

      // Восстанавливаем данные
      if (backupData.students) {
        studentService.saveStudentsList(backupData.students);
      }

      if (backupData.journal) {
        lessonService.saveJournal(backupData.journal);
      }

      if (backupData.config) {
        configService.saveConfig(backupData.config);
      }

      console.log(`✅ Данные восстановлены из: ${backupFileName}`);
      return true;

    } catch (error) {
      console.error('❌ Ошибка восстановления из копии:', error);
      return false;
    }
  }
}

export const backupService = new BackupService();