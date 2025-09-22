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
    configFile: 'config.json'
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

/**
 * Настройки презентаций
 */
export const presentationTemplates = {
  'первый закон ньютона': {
    name: 'Первый закон Ньютона',
    path: 'physics/newton-first-law.pptx',
    description: 'Закон инерции'
  },
  'второй закон ньютона': {
    name: 'Второй закон Ньютона',
    path: 'physics/newton-second-law.pptx',
    description: 'F = ma'
  },
  'кинетическая энергия': {
    name: 'Кинетическая энергия',
    path: 'physics/kinetic-energy.pptx',
    description: 'Энергия движения'
  }
} as const;

console.log('⚙️ Конфигурация приложения загружена');