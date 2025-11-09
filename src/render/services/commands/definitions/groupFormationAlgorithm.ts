import type { Student } from '../../../types';

/**
 * Утилита для перемешивания массива (Fisher-Yates shuffle)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Вычисляет целевые размеры групп
 */
export function calculateTargetSizes(
  totalStudents: number,
  divisionMode: 'groups' | 'people',
  groupCount: number,
  peoplePerGroup: number
): number[] {
  const targetSizes: number[] = [];

  if (divisionMode === 'groups') {
    const base = Math.floor(totalStudents / groupCount);
    const remainder = totalStudents % groupCount;
    for (let i = 0; i < groupCount; i++) {
      targetSizes.push(base + (i < remainder ? 1 : 0));
    }
  } else {
    let remaining = totalStudents;
    while (remaining > 0) {
      targetSizes.push(Math.min(peoplePerGroup, remaining));
      remaining -= peoplePerGroup;
    }
  }

  return targetSizes;
}

/**
 * Проверяет наличие конфликта между двумя студентами
 */
type ConflictChecker = (id1: string, id2: string) => boolean;

/**
 * Подсчитывает количество конфликтов в группах
 */
function countConflicts(groups: Student[][], hasConflict: ConflictChecker): number {
  let conflicts = 0;
  for (const group of groups) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        if (hasConflict(group[i].id, group[j].id)) {
          conflicts++;
        }
      }
    }
  }
  return conflicts;
}

/**
 * Создает сбалансированные группы с учетом конфликтов
 */
export function createBalancedGroups(
  students: Student[],
  targetSizes: number[],
  hasConflict: ConflictChecker
): { groups: Student[][], conflicts: number } {
  const totalGroups = targetSizes.length;
  const groups: Student[][] = Array(totalGroups).fill(null).map(() => []);
  const shuffled = shuffleArray(students);

  // Рекурсивное размещение с backtracking
  const placeStudent = (index: number): boolean => {
    if (index === shuffled.length) return true;
    const student = shuffled[index];

    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      if (groups[groupIndex].length >= targetSizes[groupIndex]) continue;

      let hasConflictInGroup = false;
      for (const member of groups[groupIndex]) {
        if (hasConflict(student.id, member.id)) {
          hasConflictInGroup = true;
          break;
        }
      }

      if (!hasConflictInGroup) {
        groups[groupIndex].push(student);
        if (placeStudent(index + 1)) return true;
        groups[groupIndex].pop();
      }
    }
    return false;
  };

  const success = placeStudent(0);

  // Fallback: если идеальное решение не найдено
  if (!success) {
    groups.forEach(g => g.length = 0);
    for (const student of shuffled) {
      let bestGroupIndex = 0;
      let minConflicts = Infinity;
      let minSize = Infinity;

      for (let i = 0; i < groups.length; i++) {
        if (groups[i].length >= targetSizes[i]) continue;

        let conflicts = 0;
        for (const member of groups[i]) {
          if (hasConflict(student.id, member.id)) conflicts++;
        }

        if (conflicts < minConflicts || (conflicts === minConflicts && groups[i].length < minSize)) {
          minConflicts = conflicts;
          minSize = groups[i].length;
          bestGroupIndex = i;
        }
      }
      groups[bestGroupIndex].push(student);
    }
  }

  const conflictsCount = countConflicts(groups, hasConflict);
  return { groups: groups.filter(g => g.length > 0), conflicts: conflictsCount };
}