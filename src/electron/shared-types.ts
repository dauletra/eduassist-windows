// src/electron/shared-types.ts

export interface IElectronAPI {
  // Работа с уроками
  loadStudentsList: () => Promise<Class[]>;
  getTodayLesson: (classId: string, groupId: string) => Promise<Lesson | null>;
  createLesson: (classId: string, groupId: string, topic: string) => Promise<Lesson>;
  getAllLessons: (classId: string,groupId: string) => Promise<Lesson[]>;
  updateAttendance: (lessonId: string, studentId: string, attendance: boolean) => Promise<void>;
  updateGrade: (lessonId: string, studentId: string, grade: number | null) => Promise<void>;
  updateTaskStatus: (lessonId: string, studentId: string, taskIndex: number, status: TaskStatus) => Promise<void>;

  // Поурочные планы
  selectLessonPlansFolder: () => Promise<string | null>;
  saveLessonPlansPath: (path: string) => Promise<boolean>;
  getLessonPlansPath: () => Promise<string>;
  getPresentationsPath: () => Promise<string>;
  scanLessonPlans: (basePath: string) => Promise<ClassFolder[]>;
  getCurrentClass: () => Promise<string>;
  getLessonFiles: (lessonPath: string) => Promise<FileItem[]>;

  // Команды учителя
  divideStudents: (classId: string, groupId: string, groupCount: number) => Promise<Student[][]>;
  selectRandomStudent: (classId: string, groupId: string) => Promise<Student>;
  openPresentation: (name: string) => Promise<void>;
  openFile: (filePath: string) => Promise<void>;
  openUrlFile: (filePath: string) => Promise<void>;
  closePresentation: () => Promise<void>;
  closeVideo: () => Promise<void>;
  printFile: (filePath: string) => Promise<void>;
  printTasks: () => Promise<void>;
  getDevices: () => Promise<{
    printers: Device[];
    audioInputs: Device[];
    audioOutputs: Device[];
  }>;

  // Настройки
  loadSettings: () => Promise<AppConfig>;
  saveSettings: (settings: Partial<AppConfig>) => Promise<{ success: boolean }>;

  getModelPath: (modelName: string) => Promise<string>;
  getModelUrl: (modelName: string) => Promise<string>;
  getModelFilePath: (modelName: string) => Promise<string>; // Добавляем новый метод
  getAppPath: () => Promise<string>;
  getResourcesPath: () => Promise<string>; // Добавляем новый метод

  // Управление классами
  addClassWithGroups: (className: string, groupNames: string[]) => Promise<{ success: boolean; class: Class }>;
  updateClass: (classId: string, updates: Partial<Class>) => Promise<{ success: boolean }>;
  deleteClass: (classId: string) => Promise<{ success: boolean }>;

  // Управление группами
  addGroupToClass: (classId: string, groupName: string) => Promise<{ success: boolean; group: Group }>;

  // Управление учениками
  addStudentToGroup: (classId: string, groupId: string, studentName: string) => Promise<{ success: boolean; student: Student }>;

  // Управление окнами
  openSettingsWindow: () => Promise<void>;

  // Коммуникация между окнами
  notifyMainWindow: (channel: string) => void;
  onSettingsUpdated: (callback: () => void) => void;
  removeSettingsUpdatedListener: () => void;

  // Голосовой ассистент
  startVoiceListening: () => Promise<void>;
  stopVoiceListening: () => Promise<void>;
  onWakeWordDetected: (callback: () => void) => void;
  onVoiceCommand: (callback: (cmd: any) => void) => void;
  onListeningStateChanged: (callback: (state: any) => void) => void;

  // Telegram методы
  getTelegramQRToken: (studentId: string) => Promise<TelegramQRResponse>;
  getTelegramRegistrationStatus: (classId: string, groupId: string) => Promise<{ students: TelegramRegistrationStatus[] }>;
  sendTelegramMaterial: (payload: {
    lesson_id: string;
    file_path?: string;
    url?: string;
    caption: string;
  }) => Promise<TelegramSendResponse>;
  readUrlFileContent: (filePath: string) => Promise<string>;
}

// Структура класса
export interface Class {
  id: string;
  name: string;
  groups: Group[];
}

// Структура группы
export interface Group {
  id: string;
  name: string;
  students: Student[];
  conflicts?: StudentConflict[]; // Добавить это поле
}

// Структура ученика
export interface Student {
  id: string;
  name: string;
}

// Типы статуса задания
export type TaskStatus = 0 | 1 | 2 | 3; // 0-пусто, 1-правильно, 2-неправильно, 3-половина


// Структура урока
export interface Lesson {
  id: string;
  date: string;
  topic: string;
  classId: string;
  groupId: string;
  students: LessonStudent[];
}

export interface EnrichedLessonStudent extends LessonStudent {
  name: string
}

export interface EnrichedLesson extends Omit<Lesson, 'students'> {
  students: EnrichedLessonStudent[]
}

// Context types - ОБНОВЛЕНО
export interface AppContext {
  // Основные данные
  classes: Class[];
  lessons: EnrichedLesson[];
  loading: boolean;
  error: string | null;

  // Текущее состояние
  currentClassId: string | null;
  currentGroupId: string | null;
  currentLessonId: string | null;

  // Вычисляемые данные
  currentClass: Class | null;
  currentGroup: Group | null;
  currentLesson: EnrichedLesson | null;
  groupLessons: EnrichedLesson[];

  // Методы навигации
  openJournal: (classId: string, groupId: string) => Promise<void>;
  selectLesson: (lessonId: string) => void;
  closeJournal: () => void;

  // Методы обновления данных
  updateGrade: (studentId: string, grade: number | null) => Promise<void>;
  updateAttendance: (studentId: string, attendance: boolean) => Promise<void>;
  getStudentName: (studentId: string) => string;

  // Утилиты
  clearError: () => void;
  reloadData: () => Promise<void>;
}

// Для командной системы
export interface DialogContext {
  classId?: string;
  groupId?: string;
  lessonId?: string;
  currentLesson: EnrichedLesson | null;
  hasConflict?: boolean;
}

// Ученик в уроке
export interface LessonStudent {
  id: string;
  attendance: boolean;
  grade: number | null;
  tasks?: TaskStatus[]; // Массив статусов заданий
}

export interface LessonFolder {
  name: string;
  path: string;
  week: number;
  lessonNumber: number;
  title?: string;
}

export interface ClassFolder {
  name: string;
  path: string;
  lessons: LessonFolder[];
}

export interface FileItem {
  name: string;
  path: string;
  type: 'file' | 'directory';
  extension?: string;
  size?: number;
}

export const SUPPORTED_FILE_TYPES = {
  presentations: ['.pptx', '.ppt'],
  documents: ['.docx', '.doc', '.pdf'],
  spreadsheets: ['.xlsx', '.xls'],
  images: ['.jpg', '.jpeg', '.png', '.gif'],
  videos: ['.mp4', '.avi', '.mov'],
} as const;

export type SupportedFileType = keyof typeof SUPPORTED_FILE_TYPES;

export interface Device {
  id: string;
  name: string;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface DeviceSettings {
  devices: {
    defaultPrinter?: string;
    defaultAudioInput?: string;
    defaultAudioOutput?: string;
  };
}

// Интерфейс для конфликтов между студентами (только парные)
export interface StudentConflict {
  students: [string, string]; // Ровно 2 ID студентов
  reason?: string;
}

// Конфигурация презентации
export interface PresentationConfig {
  name: string;
  path: string;
  description?: string;
}

// Состояние записи
export interface RecordingState {
  isRecording: boolean;
  isListening: boolean;
  lastCommand?: string;
}

// Конфигурация приложения
export interface AppConfig {
  // Настройки окна
  window: {
    width: number;
    height: number;
    minWidth: number;
    minHeight: number;
    resizable: boolean;
    alwaysOnTop: boolean;
  };

  // Настройки голосового движка
  voice: {
    language: string;
    keyWord: string;
    confidence: number;
    autoStart: boolean;
    responseEnabled: boolean;
  };

  // Настройки учебного процесса
  education: {
    gradeScale: {
      min: number;
      max: number;
    };
    autoSaveGrades: boolean;
    printTasksTemplate: string;
  };

  // Пути к ресурсам
  paths: {
    presentationsDir: string;
    tasksTemplatesDir: string;
    journalFile: string;
    configFile: string;
    lessonPlansDir: string;
  };

  // Устройства
  devices: {
    defaultPrinter?: string;
    defaultAudioInput?: string;
    defaultAudioOutput?: string;
  };

  // Настройки интерфейса
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ru' | 'en' | 'kk';
    animations: boolean;
    showNotifications: boolean;
  };
}

// ============================================================================
// Telegram Types
// ============================================================================

export interface TelegramRegistration {
  student_id: string;
  student_name: string;
  class_name: string;
  group_name: string;
  token: string;
  telegram_id: number | null;
  registered: boolean;
  created_at: string;
  registered_at: string | null;
}

export interface TelegramQRResponse {
  token: string;
  qr_url: string;
  registered: boolean;
}

export interface TelegramRegistrationStatus {
  id: string;
  name: string;
  registered: boolean;
  registered_at: string | null;
}

export interface TelegramSendResponse {
  success: boolean;
  sent_count: number;
}