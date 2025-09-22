// Общие интерфейсы для всего приложения

// API интерфейс для взаимодействия между процессами
export interface IElectronAPI {
  // Голосовые команды
  startVoiceRecording: () => Promise<void>;
  stopVoiceRecording: () => Promise<void>;

  // Команды учителя
  divideStudentsIntoGroups: (count: number) => Promise<string[][]>;
  selectRandomStudent: () => Promise<string>;
  openPresentation: (name: string) => Promise<void>;
  printTasks: () => Promise<void>;

  // Работа с уроками
  getTodayLesson: (classId: string, groupId: string) => Promise<Lesson | null>;
  createLesson: (classId: string, groupId: string, topic: string) => Promise<Lesson>;
  updateAttendance: (lessonId: string, studentId: string, attendance: boolean) => Promise<void>;
  updateGrade: (lessonId: string, studentId: string, grade: number | null) => Promise<void>;
  loadStudentsList: () => Promise<Class[]>;

  // Управление окном
  minimizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;

  // События
  onRecordingStateChange: (callback: (isRecording: boolean) => void) => void;
  removeRecordingStateListener: () => void;
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

// Интерфейс для конфликтов между студентами
export interface StudentConflict {
  students: string[]; // ID студентов
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