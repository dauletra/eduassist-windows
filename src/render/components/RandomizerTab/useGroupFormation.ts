// src/render/components/RandomizerTab/useGroupFormation.ts

import { useState, useCallback } from 'react';
import type { Student } from '../../types';
import { calculateTargetSizes } from './utils';
import { ANIMATION_DELAYS } from './constants';

interface UseGroupFormationProps {
  availableStudents: Student[];
  divisionMode: 'groups' | 'people';
  groupCount: number;
  peoplePerGroup: number;
  hasConflict: (id1: string, id2: string) => boolean;
  onGroupsCreated: (groups: string[][], scores: number[]) => void;
}

export function useGroupFormation({
                                    availableStudents,
                                    divisionMode,
                                    groupCount,
                                    peoplePerGroup,
                                    hasConflict,
                                    onGroupsCreated,
                                  }: UseGroupFormationProps) {
  const [isFormingGroups, setIsFormingGroups] = useState(false);
  const [animatingStudent, setAnimatingStudent] = useState<string | null>(null);

  const countConflicts = useCallback((groups: Student[][]): number => {
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
  }, [hasConflict]);

  const createBalancedGroups = useCallback((students: Student[]): { groups: Student[][], conflicts: number } => {
    const targetSizes = calculateTargetSizes(students.length, divisionMode, groupCount, peoplePerGroup);
    const totalGroups = targetSizes.length;
    const groups: Student[][] = Array(totalGroups).fill(null).map(() => []);
    const shuffled = [...students].sort(() => Math.random() - 0.5);

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

    const conflictsCount = countConflicts(groups);
    return { groups: groups.filter(g => g.length > 0), conflicts: conflictsCount };
  }, [divisionMode, groupCount, peoplePerGroup, hasConflict, countConflicts]);

  const divideIntoGroups = useCallback(async () => {
    if (!availableStudents.length) return;

    setIsFormingGroups(true);

    // Шаг 1: Анализ конфликтов
    setAnimatingStudent('🔍 Анализирую конфликты и создаю группы...');
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.MESSAGE_DISPLAY));

    // Шаг 2: Создание сбалансированных групп
    const result = createBalancedGroups(availableStudents);

    // Шаг 3: Показываем результат анализа
    if (result.conflicts === 0) {
      setAnimatingStudent('✨ Идеальное решение найдено без конфликтов!');
    } else {
      setAnimatingStudent(`⚠️ Решение с ${result.conflicts} неизбежным${result.conflicts > 1 ? 'и' : ''} конфликт${result.conflicts > 1 ? 'ами' : 'ом'}`);
    }
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.RESULT_DISPLAY));

    // Шаг 4: Инициализируем пустые группы для анимации
    const emptyGroups = result.groups.map(() => [] as string[]);
    onGroupsCreated(emptyGroups, new Array(result.groups.length).fill(0));

    setAnimatingStudent('🎲 Начинаю размещение студентов...');
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.PLACEMENT_STEP));

    // Шаг 5: АНИМАЦИЯ - Постепенное размещение студентов
    const allStudents = result.groups.flat();

    for (let index = 0; index < allStudents.length; index++) {
      const student = allStudents[index];

      // Находим, в какую группу должен попасть этот студент
      const groupIndex = result.groups.findIndex(group =>
        group.some(s => s.id === student.id)
      );

      // Обновляем сообщение о размещении
      setAnimatingStudent(`Размещаю: ${student.name} → Группа ${groupIndex + 1}`);

      // Создаем промежуточное состояние групп
      const currentGroups = result.groups.map((group, gIndex) => {
        if (gIndex < groupIndex) {
          // Группы с меньшим индексом уже заполнены
          return group.map(s => s.name);
        } else if (gIndex === groupIndex) {
          // Текущая группа - добавляем студентов до текущего включительно
          const currentStudentIndex = group.findIndex(s => s.id === student.id);
          return group.slice(0, currentStudentIndex + 1).map(s => s.name);
        } else {
          // Будущие группы пока пустые
          return [];
        }
      });

      // Обновляем UI с текущим состоянием
      onGroupsCreated(currentGroups, new Array(result.groups.length).fill(0));

      // Задержка для визуализации
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.PLACEMENT_STEP));
    }

    // Шаг 6: Финальное сообщение
    if (result.conflicts === 0) {
      setAnimatingStudent('🎉 Все группы сформированы без конфликтов!');
    } else {
      setAnimatingStudent('✅ Группы сбалансированы с минимальными конфликтами');
    }
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.MESSAGE_DISPLAY));

    setAnimatingStudent(null);
    setIsFormingGroups(false);
  }, [availableStudents, createBalancedGroups, onGroupsCreated]);

  return {
    isFormingGroups,
    animatingStudent,
    divideIntoGroups,
  };
}