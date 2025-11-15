// src/render/services/domain/GroupService.ts
import { AppStore } from "../../store";
import { calculateTargetSizes, createBalancedGroups } from "../commands/definitions/groupFormationAlgorithm";

export class GroupService {
  private store: AppStore;
  constructor(store: AppStore) {
    this.store = store;
  }

  divideByCount(count: number, onlyPresent = true) {
    const state = this.store.getState();
    const lesson = state.currentLesson;
    if (!lesson) return { success: false, message: "Нет активного урока" };

    const pool = onlyPresent ? lesson.students.filter(s => s.attendance) : lesson.students.slice();
    if (pool.length === 0) {
      return { success: false, message: onlyPresent ? "Нет присутствующих учеников" : "Список пуст" };
    }
    if (!Number.isFinite(count) || count <= 0 || count > pool.length) {
      return { success: false, message: `Некорректное количество групп: ${count}` };
    }

    const hasConflict = state.currentGroup?.conflicts
      ? (id1: string, id2: string) => state.currentGroup!.conflicts!.some(c => c.students.includes(id1) && c.students.includes(id2))
      : () => false;

    const targetSizes = calculateTargetSizes(pool.length, 'groups', count, 0);
    const result = createBalancedGroups(pool, targetSizes, hasConflict);
    const groups = result.groups;

    return {
      success: true,
      message: `Ученики разделены на ${count} групп`,
      data: {
        type: 'groups_formed',
        method: 'by_count',
        groupCount: count,
        groups: groups.map(g => g.map(s => ({ id: s.id, name: s.name })))
      }
    };
  }

  divideBySize(size: number, onlyPresent = true) {
    const state = this.store.getState();
    const lesson = state.currentLesson;
    if (!lesson) return { success: false, message: "Нет активного урока" };

    const pool = onlyPresent ? lesson.students.filter(s => s.attendance) : lesson.students.slice();
    if (pool.length === 0) {
      return { success: false, message: onlyPresent ? "Нет присутствующих учеников" : "Список пуст" };
    }
    if (!Number.isFinite(size) || size <= 0 || size > pool.length) {
      return { success: false, message: `Некорректное количество человек: ${size}` };
    }

    const hasConflict = state.currentGroup?.conflicts
      ? (id1: string, id2: string) => state.currentGroup!.conflicts!.some(c => c.students.includes(id1) && c.students.includes(id2))
      : () => false;

    const targetSizes = calculateTargetSizes(pool.length, 'people', 0, size);
    const result = createBalancedGroups(pool, targetSizes, hasConflict);
    const groups = result.groups;

    return {
      success: true,
      message: `Ученики разделены по ${size} человек`,
      data: {
        type: 'groups_formed',
        method: 'by_size',
        groupSize: size,
        groups: groups.map(g => g.map(s => ({ id: s.id, name: s.name })))
      }
    };
  }
}
