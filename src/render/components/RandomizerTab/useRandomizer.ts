// src/render/components/RandomizerTab/useRandomizer.ts

import { useState, useMemo, useCallback, useRef } from 'react';
import type { Lesson, Group } from '../../types';
// import { calculateTargetSizes } from './utils';
import { ANIMATION_DELAYS, RANDOMIZE_ITERATIONS } from './constants';

interface UseRandomizerProps {
  currentLesson: Lesson | null;
  groupData: Group | null;
  includeAbsent: boolean;
}

export function useRandomizer({ currentLesson, groupData, includeAbsent }: UseRandomizerProps) {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<(string | null)[]>([]);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomGroups, setRandomGroups] = useState<string[][]>([]);
  const [selectFromGroup, setSelectFromGroup] = useState<number | null>(null);
  // Храним последних выбранных учеников для каждой группы
  const lastSelectedByGroup = useRef<Map<number | null, string[]>>(new Map());

  const hasGroups = randomGroups.length > 0;

  const availableStudents = useMemo(() => {
    if (!currentLesson?.students || !groupData) return [];

    const attendanceMap = new Map();
    currentLesson.students.forEach(student => {
      attendanceMap.set(student.id, student.attendance);
    });

    return groupData.students.filter(student => {
      if (includeAbsent) return true;
      const attendance = attendanceMap.get(student.id) ?? true;
      return attendance;
    });
  }, [currentLesson, groupData, includeAbsent]);

  const conflictMap = useMemo(() => {
    if (!groupData?.conflicts) return new Map();

    const map = new Map<string, Set<string>>();

    groupData.conflicts.forEach(conflict => {
      const [studentId1, studentId2] = conflict.students;

      if (!map.has(studentId1)) map.set(studentId1, new Set());
      if (!map.has(studentId2)) map.set(studentId2, new Set());

      map.get(studentId1)!.add(studentId2);
      map.get(studentId2)!.add(studentId1);
    });

    return map;
  }, [groupData]);

  const hasConflict = useCallback((studentId1: string, studentId2: string): boolean => {
    return conflictMap.get(studentId1)?.has(studentId2) ?? false;
  }, [conflictMap]);

  const randomizeStudent = useCallback(async (groupIndex: number | null = null) => {
    if (!availableStudents.length) return;

    setIsRandomizing(true);
    setSelectFromGroup(groupIndex);

    const studentsToSelect = groupIndex !== null
      ? randomGroups[groupIndex].map(name => availableStudents.find(s => s.name === name)!).filter(Boolean)
      : availableStudents;

    if (studentsToSelect.length === 0) {
      setIsRandomizing(false);
      return;
    }

    // Получаем список последних выбранных для этой группы/общего выбора
    const lastSelected = lastSelectedByGroup.current.get(groupIndex) || [];

    // Фильтруем список: исключаем последнего выбранного, если есть другие варианты
    let filteredStudents = studentsToSelect;
    if (lastSelected.length > 0 && studentsToSelect.length > 1) {
      filteredStudents = studentsToSelect.filter(s => !lastSelected.includes(s.name));

      // Если отфильтровали всех (все недавно выбирались), берем всех
      if (filteredStudents.length === 0) {
        filteredStudents = studentsToSelect;
        // Очищаем историю для этой группы
        lastSelectedByGroup.current.set(groupIndex, []);
      }
    }

    // Анимация рандомизации - показываем ВСЕ студенты из списка
    let finalStudent = '';
    for (let i = 0; i < RANDOMIZE_ITERATIONS; i++) {
      const randomIndex = Math.floor(Math.random() * studentsToSelect.length);
      const student = studentsToSelect[randomIndex].name;

      // На последней итерации выбираем из отфильтрованного списка
      if (i === RANDOMIZE_ITERATIONS - 1) {
        const finalIndex = Math.floor(Math.random() * filteredStudents.length);
        finalStudent = filteredStudents[finalIndex].name;
      } else {
        finalStudent = student;
      }

      if (!hasGroups) {
        setSelectedStudent(finalStudent);
      } else if (groupIndex !== null) {
        setSelectedGroupStudents(prev => {
          const newSelected = [...prev];
          newSelected[groupIndex] = finalStudent;
          return newSelected;
        });
      } else {
        setSelectedGroupStudents(randomGroups.map(() => finalStudent));
      }

      await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.RANDOMIZE_STEP));
    }

    // Сохраняем выбранного студента в историю
    const currentHistory = lastSelectedByGroup.current.get(groupIndex) || [];
    const maxHistorySize = Math.max(1, Math.floor(filteredStudents.length * 0.3)); // Храним до 30% от количества студентов

    const newHistory = [finalStudent, ...currentHistory].slice(0, maxHistorySize);
    lastSelectedByGroup.current.set(groupIndex, newHistory);

    setIsRandomizing(false);
  }, [availableStudents, randomGroups, hasGroups]);

  const resetSelection = useCallback(() => {
    if (hasGroups) {
      setSelectedGroupStudents(new Array(randomGroups.length).fill(null));
    } else {
      setSelectedStudent(null);
    }
  }, [hasGroups, randomGroups.length]);

  // Очистка истории при изменении доступных студентов
  const clearHistory = useCallback(() => {
    lastSelectedByGroup.current.clear();
  }, []);

  return {
    selectedStudent,
    selectedGroupStudents,
    isRandomizing,
    randomGroups,
    availableStudents,
    hasGroups,
    selectFromGroup,
    hasConflict,
    setRandomGroups,
    setSelectedGroupStudents,
    setSelectedStudent,
    randomizeStudent,
    resetSelection,
    clearHistory,
  };
}