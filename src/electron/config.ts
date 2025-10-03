/**
 * Конфигурация приложения голосового ассистента учителя
 */
import type { AppConfig } from './shared-types.js';

/**
 * Конфигурация по умолчанию
 */
export const defaultConfig: AppConfig = {
  window: {
    width: 1000,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    resizable: true,
    alwaysOnTop: false
  },

  voice: {
    language: 'ru-RU',
    keyWord: 'учитель',
    confidence: 0.7,
    autoStart: true,
    responseEnabled: true
  },

  education: {
    gradeScale: {
      min: 1,
      max: 10
    },
    autoSaveGrades: true,
    printTasksTemplate: 'default'
  },

  paths: {
    presentationsDir: 'presentations',
    tasksTemplatesDir: 'templates',
    journalFile: 'journal.json',
    configFile: 'config.json',
    lessonPlansDir: ''
  },

  ui: {
    theme: 'light',
    language: 'ru',
    animations: true,
    showNotifications: true
  }
};

/**
 * Команды, которые распознает голосовой ассистент
 */
export const voiceCommands = {
  // Работа с уроками
  createLesson: [
    'создай урок',
    'новый урок',
    'открой урок'
  ],

  // Посещаемость
  markAttendance: [
    'отметь посещаемость',
    'ученик присутствует',
    'ученик отсутствует'
  ],

  // Работа с группами
  divideGroups: [
    'подели учеников на группы',
    'раздели учеников на группы',
    'создай группы'
  ],

  // Выбор ученика
  selectStudent: [
    'выбери ученика',
    'случайный ученик',
    'кто отвечает'
  ],

  // Оценки
  setGrade: [
    'поставь оценку',
    'оцени ученика',
    'поставь балл'
  ],

  // Презентации
  openPresentation: [
    'открой презентацию',
    'покажи презентацию',
    'запусти презентацию'
  ],

  // Печать
  printTasks: [
    'распечатай задачи',
    'печать задач',
    'напечатай задания'
  ]
} as const;

console.log('⚙️ Конфигурация приложения загружена');