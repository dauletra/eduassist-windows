// src/electron/utils/validators.ts

/**
 * Кастомная ошибка валидации
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ==================== БАЗОВЫЕ ВАЛИДАТОРЫ ====================

/**
 * Проверка что значение - непустая строка
 */
export function validateString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string') {
    throw new ValidationError(`${fieldName} должно быть строкой`);
  }

  if (value.trim().length === 0) {
    throw new ValidationError(`${fieldName} не может быть пустым`);
  }
}

/**
 * Проверка ID (любого типа)
 */
export function validateId(id: unknown, type: string = 'ID'): asserts id is string {
  if (typeof id !== 'string') {
    throw new ValidationError(`${type} должен быть строкой`);
  }

  if (id.trim().length === 0) {
    throw new ValidationError(`${type} не может быть пустым`);
  }
}

/**
 * Проверка числа в диапазоне
 */
export function validateNumber(
  value: unknown,
  fieldName: string,
  min?: number,
  max?: number
): asserts value is number {
  if (typeof value !== 'number') {
    throw new ValidationError(`${fieldName} должно быть числом`);
  }

  if (Number.isNaN(value)) {
    throw new ValidationError(`${fieldName} не является допустимым числом`);
  }

  if (min !== undefined && value < min) {
    throw new ValidationError(`${fieldName} не может быть меньше ${min}`);
  }

  if (max !== undefined && value > max) {
    throw new ValidationError(`${fieldName} не может быть больше ${max}`);
  }
}

// ==================== ВАЛИДАТОРЫ ДЛЯ КЛАССОВ ====================

/**
 * Проверка имени класса
 */
export function validateClassName(name: unknown): asserts name is string {
  validateString(name, 'Имя класса');

  const className = name as string;

  if (className.length > 50) {
    throw new ValidationError('Имя класса слишком длинное (макс. 50 символов)');
  }

  // Разрешены только буквы, цифры, пробелы и дефисы
  if (!/^[а-яА-ЯёЁa-zA-Z0-9\s-]+$/.test(className)) {
    throw new ValidationError('Имя класса содержит недопустимые символы');
  }
}

/**
 * Проверка массива имен групп
 */
export function validateGroupNames(names: unknown): asserts names is string[] {
  if (!Array.isArray(names)) {
    throw new ValidationError('Список групп должен быть массивом');
  }

  if (names.length === 0) {
    throw new ValidationError('Необходимо указать хотя бы одну группу');
  }

  if (names.length > 10) {
    throw new ValidationError('Слишком много групп (макс. 10)');
  }

  names.forEach((name, index) => {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError(`Группа ${index + 1} имеет некорректное имя`);
    }

    if (name.length > 50) {
      throw new ValidationError(`Группа ${index + 1}: имя слишком длинное (макс. 50 символов)`);
    }
  });
}

/**
 * Проверка имени группы
 */
export function validateGroupName(name: unknown): asserts name is string {
  validateString(name, 'Имя группы');

  const groupName = name as string;

  if (groupName.length > 50) {
    throw new ValidationError('Имя группы слишком длинное (макс. 50 символов)');
  }
}

// ==================== ВАЛИДАТОРЫ ДЛЯ СТУДЕНТОВ ====================

/**
 * Проверка имени студента
 */
export function validateStudentName(name: unknown): asserts name is string {
  validateString(name, 'Имя ученика');

  const studentName = name as string;

  if (studentName.length < 2) {
    throw new ValidationError('Имя ученика слишком короткое (мин. 2 символа)');
  }

  if (studentName.length > 100) {
    throw new ValidationError('Имя ученика слишком длинное (макс. 100 символов)');
  }

  // Разрешены буквы, пробелы, точки и дефисы
  if (!/^[а-яА-ЯёЁa-zA-Z\s.-]+$/.test(studentName)) {
    throw new ValidationError('Имя ученика содержит недопустимые символы');
  }
}

// ==================== ВАЛИДАТОРЫ ДЛЯ УРОКОВ ====================

/**
 * Проверка темы урока
 */
export function validateLessonTopic(topic: unknown): asserts topic is string {
  validateString(topic, 'Тема урока');

  const lessonTopic = topic as string;

  if (lessonTopic.length > 200) {
    throw new ValidationError('Тема урока слишком длинная (макс. 200 символов)');
  }
}

/**
 * Проверка оценки
 */
export function validateGrade(grade: unknown, min: number = 1, max: number = 10): void {
  // null/undefined допустимы (нет оценки)
  if (grade === null || grade === undefined) {
    return;
  }

  if (typeof grade !== 'number') {
    throw new ValidationError('Оценка должна быть числом');
  }

  if (!Number.isInteger(grade)) {
    throw new ValidationError('Оценка должна быть целым числом');
  }

  if (grade < min || grade > max) {
    throw new ValidationError(`Оценка должна быть от ${min} до ${max}`);
  }
}

/**
 * Проверка статуса посещаемости
 */
export function validateAttendance(attendance: unknown): asserts attendance is boolean {
  if (typeof attendance !== 'boolean') {
    throw new ValidationError('Посещаемость должна быть boolean');
  }
}

// ==================== ВАЛИДАТОРЫ ДЛЯ ГРУПП И РАЗДЕЛЕНИЯ ====================

/**
 * Проверка количества групп
 */
export function validateGroupCount(count: unknown): asserts count is number {
  validateNumber(count, 'Количество групп', 1, 20);

  if (!Number.isInteger(count)) {
    throw new ValidationError('Количество групп должно быть целым числом');
  }
}

// ==================== ВАЛИДАТОРЫ ДЛЯ НАСТРОЕК ====================

/**
 * Проверка настроек приложения
 */
export function validateAppSettings(settings: unknown): asserts settings is Record<string, any> {
  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Настройки должны быть объектом');
  }

  const settingsObj = settings as Record<string, any>;

  // Проверка UI настроек
  if (settingsObj.ui) {
    if (typeof settingsObj.ui !== 'object') {
      throw new ValidationError('UI настройки должны быть объектом');
    }

    if (settingsObj.ui.theme && !['light', 'dark', 'auto'].includes(settingsObj.ui.theme)) {
      throw new ValidationError('Тема должна быть: light, dark или auto');
    }

    if (settingsObj.ui.language && !['ru', 'en', 'kk'].includes(settingsObj.ui.language)) {
      throw new ValidationError('Язык должен быть: ru, en или kk');
    }
  }

  // Проверка голосовых настроек
  if (settingsObj.voice) {
    if (typeof settingsObj.voice !== 'object') {
      throw new ValidationError('Голосовые настройки должны быть объектом');
    }

    if (settingsObj.voice.enabled !== undefined && typeof settingsObj.voice.enabled !== 'boolean') {
      throw new ValidationError('voice.enabled должно быть boolean');
    }

    if (settingsObj.voice.wakeWord && typeof settingsObj.voice.wakeWord !== 'string') {
      throw new ValidationError('voice.wakeWord должно быть строкой');
    }
  }

  // Проверка образовательных настроек
  if (settingsObj.education?.gradeSystem) {
    const { min, max } = settingsObj.education.gradeSystem;

    if (typeof min !== 'number' || typeof max !== 'number') {
      throw new ValidationError('Минимальная и максимальная оценки должны быть числами');
    }

    if (min >= max) {
      throw new ValidationError('Минимальная оценка должна быть меньше максимальной');
    }

    if (min < 0 || max > 100) {
      throw new ValidationError('Оценки должны быть в диапазоне от 0 до 100');
    }
  }
}

// ==================== ВАЛИДАТОРЫ ДЛЯ ПРЕЗЕНТАЦИЙ ====================

/**
 * Проверка имени презентации
 */
export function validatePresentationName(name: unknown): asserts name is string {
  validateString(name, 'Имя презентации');

  const presentationName = name as string;

  if (presentationName.length > 100) {
    throw new ValidationError('Имя презентации слишком длинное (макс. 100 символов)');
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Проверить, является ли ошибка ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/**
 * Безопасно получить сообщение об ошибке
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'Неизвестная ошибка';
}