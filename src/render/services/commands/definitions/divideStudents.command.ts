import type { CommandDefinition } from '../types';
// import type { EnrichedLessonStudent } from '../../../types';
import { createBalancedGroups, calculateTargetSizes } from "./groupFormationAlgorithm.ts";

/**
 * Команда деления учеников на N групп
 *
 * Может быть вызвана:
 * - Голосом: "Раздели на 3 группы"
 * - UI: ввод количества групп в рандомайзере
 */
export const divideByGroupCountCommand: CommandDefinition = {
  type: 'DivideByGroupCount',
  displayName: 'Разделить на N групп',
  description: 'Разделить учеников на заданное количество групп',
  requiresContext: true,

  params: [
    {
      name: 'numberValue',
      type: 'number',
      entityCategory: 'NumberValue',
      required: true,
      description: 'Количество групп (2-10)',
      validate: (value, _context, currentLesson) => {
        const count = Number(value);
        const maxCount = currentLesson?.students?.length || 0;

        if (!Number.isInteger(count)) {
          return 'Количество групп должно быть целым числом';
        }
        if (count < 2) {
          return 'Минимум 2 группы';
        }
        if (count > maxCount) {
          return `Максимум ${maxCount} групп (по количеству учеников)`;
        }

        return true;
      },
      transform: (value) => {
        const numberWords: Record<string, number> = {
          'два': 2, 'две': 2, 'двое': 2,
          'три': 3, 'трое': 3,
          'четыре': 4, 'пять': 5, 'шесть': 6,
          'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10
        };

        const normalized = String(value).toLowerCase().trim();
        return numberWords[normalized] ?? Number(value);
      }
    },
    {
      name: 'onlyPresent',
      type: 'boolean',
      required: false,
      default: true,
      description: 'Делить только присутствующих учеников'
    }
  ],

  execute: async (params, _context, currentLesson) => {
    if (!currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал класса'
      };
    }

    const groupCount = Number(params.numberValue);
    const onlyPresent = params.onlyPresent !== false;

    // Определить учеников для деления
    const students = onlyPresent
      ? currentLesson.students.filter(s => s.attendance)
      : currentLesson.students;

    if (students.length === 0) {
      return {
        success: false,
        message: onlyPresent ? 'Нет присутствующих учеников' : 'Список учеников пуст'
      };
    }

    if (groupCount > students.length) {
      return {
        success: false,
        message: `Нельзя создать ${groupCount} групп из ${students.length} учеников`
      };
    }

    // Получить функцию проверки конфликтов из контекста
    const hasConflict = _context.hasConflict || (() => false);

// Вычислить целевые размеры групп
    const targetSizes = calculateTargetSizes(students.length, 'groups', groupCount, 0);

// Создать сбалансированные группы с учетом конфликтов
    const result = createBalancedGroups(students, targetSizes, hasConflict);
    const groups = result.groups;

    // Сформировать сообщение
    const groupWord = groupCount === 2 ? 'группы' :
      groupCount === 3 || groupCount === 4 ? 'группы' : 'групп';
    const message = `Ученики разделены на ${groupCount} ${groupWord}`;

    console.log('👥 Groups formed by count:', groups.map(g => g.length));

    return {
      success: true,
      message,
      data: {
        type: 'groups_formed',
        method: 'by_count',
        groupCount,
        groups: groups.map(group => group.map(s => ({
          id: s.id,
          name: s.name
        })))
      }
    };
  }
};

/**
 * Команда деления учеников по N человек в группе
 *
 * Может быть вызвана:
 * - Голосом: "Раздели по 3 человека"
 * - UI: ввод размера группы в рандомайзере
 */
export const divideByGroupSizeCommand: CommandDefinition = {
  type: 'DivideByGroupSize',
  displayName: 'Разделить по N человек',
  description: 'Разделить учеников на группы заданного размера',
  requiresContext: true,

  params: [
    {
      name: 'numberValue',
      type: 'number',
      entityCategory: 'NumberValue',
      required: true,
      description: 'Размер группы (1-10)',
      validate: (value, _context, currentLesson) => {
        const size = Number(value);
        const maxSize = currentLesson?.students?.length || 0;

        if (!Number.isInteger(size)) {
          return 'Размер группы должен быть целым числом';
        }
        if (size < 1) {
          return 'Минимум 1 ученик в группе';
        }
        if (size > maxSize) {
          return `Максимум ${maxSize} учеников (всего в списке)`;
        }

        return true;
      },
      transform: (value) => {
        // Обработка слова "пары" -> 2
        const normalized = String(value).toLowerCase().trim();
        if (/^пар[аыуе]?$/i.test(normalized)) {
          return 2;
        }

        const numberWords: Record<string, number> = {
          'два': 2, 'две': 2, 'двое': 2,
          'три': 3, 'трое': 3,
          'четыре': 4, 'пять': 5, 'шесть': 6,
          'семь': 7, 'восемь': 8, 'девять': 9, 'десять': 10
        };

        return numberWords[normalized] ?? Number(value);
      }
    },
    {
      name: 'onlyPresent',
      type: 'boolean',
      required: false,
      default: true,
      description: 'Делить только присутствующих учеников'
    }
  ],

  execute: async (params, _context, currentLesson) => {
    if (!currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал класса'
      };
    }

    const groupSize = Number(params.numberValue);
    const onlyPresent = params.onlyPresent !== false;

    // Определить учеников для деления
    const students = onlyPresent
      ? currentLesson.students.filter(s => s.attendance)
      : currentLesson.students;

    if (students.length === 0) {
      return {
        success: false,
        message: onlyPresent ? 'Нет присутствующих учеников' : 'Список учеников пуст'
      };
    }

    // Получить функцию проверки конфликтов из контекста
    const hasConflict = _context.hasConflict || (() => false);

// Вычислить целевые размеры групп
    const targetSizes = calculateTargetSizes(students.length, 'people', 0, groupSize);

// Создать сбалансированные группы с учетом конфликтов
    const result = createBalancedGroups(students, targetSizes, hasConflict);
    const groups = result.groups;

    // Сформировать сообщение
    const groupsCount = groups.length;
    const studentWord = groupSize === 1 ? 'ученику' :
      groupSize < 5 ? 'ученика' : 'учеников';
    const groupWord = groupsCount === 1 ? 'группа' :
      groupsCount < 5 ? 'группы' : 'групп';

    const message = `Ученики разделены по ${groupSize} ${studentWord}. Получилось ${groupsCount} ${groupWord}`;

    console.log('👥 Groups formed by size:', groups.map(g => g.length));

    return {
      success: true,
      message,
      data: {
        type: 'groups_formed',
        method: 'by_size',
        groupSize,
        groups: groups.map(group => group.map(s => ({
          id: s.id,
          name: s.name
        })))
      }
    };
  }
};