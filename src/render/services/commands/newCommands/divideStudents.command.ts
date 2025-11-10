// src/render/services/commands/newCommands/divideStudents.command.ts

import type { NewCommand, NewCommandResult } from '../NewCommandDispatcher';
import type { AppStore } from '../../../store';
import { createBalancedGroups, calculateTargetSizes } from '../definitions/groupFormationAlgorithm';

/**
 * Новая команда деления учеников на N групп
 */
export const divideByGroupCountCommand: NewCommand = {
  type: 'DivideByGroupCount',

  async execute(store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const { numberValue: groupCount, onlyPresent = true } = params;
    const state = store.getState();

    if (!state.currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал класса'
      };
    }

    // Определить учеников для деления
    const students = onlyPresent
      ? state.currentLesson.students.filter(s => s.attendance)
      : state.currentLesson.students;

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

    // Получить функцию проверки конфликтов
    const hasConflict = state.currentGroup?.conflicts
      ? (id1: string, id2: string) =>
        state.currentGroup!.conflicts!.some(conflict =>
          conflict.students.includes(id1) && conflict.students.includes(id2)
        )
      : () => false;

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
 * Новая команда деления учеников по N человек в группе
 */
export const divideByGroupSizeCommand: NewCommand = {
  type: 'DivideByGroupSize',

  async execute(store: AppStore, params: Record<string, any>): Promise<NewCommandResult> {
    const { numberValue: groupSize, onlyPresent = true } = params;
    const state = store.getState();

    if (!state.currentLesson) {
      return {
        success: false,
        message: 'Сначала откройте журнал класса'
      };
    }

    // Определить учеников для деления
    const students = onlyPresent
      ? state.currentLesson.students.filter(s => s.attendance)
      : state.currentLesson.students;

    if (students.length === 0) {
      return {
        success: false,
        message: onlyPresent ? 'Нет присутствующих учеников' : 'Список учеников пуст'
      };
    }

    // Получить функцию проверки конфликтов
    const hasConflict = state.currentGroup?.conflicts
      ? (id1: string, id2: string) =>
        state.currentGroup!.conflicts!.some(conflict =>
          conflict.students.includes(id1) && conflict.students.includes(id2)
        )
      : () => false;

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