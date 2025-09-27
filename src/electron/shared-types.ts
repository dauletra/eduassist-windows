// Общие интерфейсы для всего приложения

// Расширенный интерфейс для window.electronAPI
export interface IElectronAPI {
  // Работа с уроками
  loadStudentsList: () => Promise<Class[]>;
  getTodayLesson: (classId: string, groupId: string) => Promise<Lesson | null>;
  createLesson: (classId: string, groupId: string, topic: string) => Promise<Lesson>;
  updateAttendance: (lessonId: string, studentId: string, attendance: boolean) => Promise<void>;
  updateGrade: (lessonId: string, studentId: string, grade: number | null) => Promise<void>;

  // Команды учителя
  divideStudents: (classId: string, groupId: string, groupCount: number) => Promise<Student[][]>;
  selectRandomStudent: (classId: string, groupId: string) => Promise<Student>;
  openPresentation: (name: string) => Promise<void>;
  printTasks: () => Promise<void>;

  // Настройки
  loadSettings: () => Promise<AppConfig>;
  saveSettings: (settings: Partial<AppConfig>) => Promise<{ success: boolean }>;

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

// Структура урока
export interface Lesson {
  id: string;
  date: string;
  topic: string;
  classId: string;
  groupId: string;
  students: LessonStudent[];
}

// Ученик в уроке
export interface LessonStudent {
  id: string;
  attendance: boolean;
  grade: number | null;
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
  };

  // Настройки интерфейса
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ru' | 'en' | 'kk';
    animations: boolean;
    showNotifications: boolean;
  };
}