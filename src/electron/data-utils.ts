/**
 * Утилиты для работы с файлами и данными
 */

import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { AppConfig } from './shared-types.js';
import { defaultConfig } from './config.js';

// Импортируем типы напрямую из shared-types
import type { Student,  Class, Lesson } from './shared-types.js';

/**
 * Получить путь к директории пользовательских данных
 */
export function getUserDataPath(): string {
  const userDataPath = path.join(app.getPath('downloads'), 'eduassist-windows-files');
  return userDataPath;
}

/**
 * Создать директорию, если она не существует
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Безопасное чтение JSON файла
 */
export function readJsonFile<T>(filePath: string, defaultValue: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content) as T;
    }
  } catch (error) {
    console.error(`❌ Ошибка чтения файла ${filePath}:`, error);
  }

  return defaultValue;
}

/**
 * Безопасная запись JSON файла
 */
export function writeJsonFile<T>(filePath: string, data: T): boolean {
  try {
    ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Ошибка записи файла ${filePath}:`, error);
    return false;
  }
}

/**
 * Загрузить конфигурацию приложения
 */
export function loadAppConfig(): AppConfig {
  const configPath = path.join(getUserDataPath(), 'config.json');
  return readJsonFile(configPath, defaultConfig);
}

/**
 * Загрузить список классов и учеников
 */
export function loadStudentsList(): Class[] {
  const studentsPath = path.join(getUserDataPath(), 'students.json');
  return readJsonFile<Class[]>(studentsPath, []);
}

/**
 * Загрузить журнал уроков
 */
export function loadJournal(): Lesson[] {
  const journalPath = path.join(getUserDataPath(), 'journal.json');
  return readJsonFile<Lesson[]>(journalPath, []);
}

/**
 * Сохранить журнал уроков
 */
export function saveJournal(journal: Lesson[]): boolean {
  const journalPath = path.join(getUserDataPath(), 'journal.json');
  return writeJsonFile(journalPath, journal);
}

/**
 * Получить урок на сегодня или создать новый
 */
export function getTodayLesson(classId: string, groupId: string): Lesson | null {
  const journal = loadJournal();
  const today = new Date().toISOString().split('T')[0];

  return journal.find(lesson =>
    lesson.date === today &&
    lesson.classId === classId &&
    lesson.groupId === groupId
  ) || null;
}

/**
 * Создать новый урок - ИСПРАВЛЕНО!
 */
export function createLesson(classId: string, groupId: string, topic: string): Lesson {
  const students = loadStudentsList();
  const cls = students.find(c => c.id === classId);
  const group = cls?.groups.find(g => g.id === groupId);

  if (!group) {
    throw new Error('Группа не найдена');
  }

  const lesson: Lesson = {
    id: `lesson-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    topic,
    classId,
    groupId,
    // ИСПРАВЛЕНО: используем student.id, а не student.name
    students: group.students.map(student => ({
      id: student.id,        // s001, s002...
      attendance: true,      // По умолчанию присутствует
      grade: null
    }))
  };

  const journal = loadJournal();
  journal.push(lesson);
  saveJournal(journal);

  return lesson;
}

/**
 * Обновить посещаемость ученика
 */
export function updateAttendance(lessonId: string, studentId: string, attendance: boolean): boolean {
  const journal = loadJournal();
  const lesson = journal.find(l => l.id === lessonId);
  const student = lesson?.students.find(s => s.id === studentId);

  if (student) {
    student.attendance = attendance;
    return saveJournal(journal);
  }

  return false;
}

/**
 * Обновить оценку ученика
 */
export function updateGrade(lessonId: string, studentId: string, grade: number | null): boolean {
  const journal = loadJournal();
  const lesson = journal.find(l => l.id === lessonId);
  const student = lesson?.students.find(s => s.id === studentId);

  if (student) {
    student.grade = grade;
    return saveJournal(journal);
  }

  return false;
}

/**
 * Получить студентов группы по ID - ИСПРАВЛЕНО!
 */
export function getStudentsByGroup(classId: string, groupId: string): Student[] {
  const students = loadStudentsList();
  const cls = students.find(c => c.id === classId);
  const group = cls?.groups.find(g => g.id === groupId);

  return group?.students || []; // Возвращаем массив объектов Student
}

/**
 * Создать резервную копию данных
 */
export function createBackup(): string | null {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(getUserDataPath(), 'backups');
    ensureDirectoryExists(backupDir);

    const backupFile = path.join(backupDir, `backup-${timestamp}.json`);

    const backupData = {
      timestamp: new Date().toISOString(),
      config: loadAppConfig(),
      students: loadStudentsList(),
      journal: loadJournal()
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    return backupFile;
  } catch (error) {
    console.error('❌ Ошибка создания резервной копии:', error);
    return null;
  }
}

/**
 * Очистка старых резервных копий (оставляем только последние 10)
 */
export function cleanupOldBackups(): void {
  try {
    const backupDir = path.join(getUserDataPath(), 'backups');

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

    files.slice(10).forEach(file => {
      fs.unlinkSync(file.path);
    });

  } catch (error) {
    console.error('❌ Ошибка очистки резервных копий:', error);
  }
}

/**
 * Инициализация структуры данных при первом запуске
 */
export function initializeDataStructure(): void {
  const userDataPath = getUserDataPath();

  ensureDirectoryExists(path.join(userDataPath, 'backups'));

  const configPath = path.join(userDataPath, 'config.json');
  if (!fs.existsSync(configPath)) {
    writeJsonFile(configPath, defaultConfig);
  }

  const studentsPath = path.join(userDataPath, 'students.json');
  if (!fs.existsSync(studentsPath)) {
    writeJsonFile(studentsPath, []);
  }

  const journalPath = path.join(userDataPath, 'journal.json');
  if (!fs.existsSync(journalPath)) {
    writeJsonFile(journalPath, []);
  }
}