// src/render/components/RandomizerTab/index.tsx
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, Shuffle } from 'lucide-react';
import type { Lesson, SelectedGroup, Group, Student } from '../../types';
import { GroupCard } from './GroupCard';
import { RandomizerSettings } from './RandomizerSettings';
import { ANIMATION_DELAYS, RANDOMIZE_ITERATIONS } from './constants';
import { calculateTargetSizes, getGridColumnsClass } from './utils';

interface RandomizerTabProps {
  selectedGroup: SelectedGroup;
  currentLesson: Lesson | null;
  groupData: Group | null;
  className?: string;
}

const RandomizerTab = ({ selectedGroup, currentLesson, groupData }: RandomizerTabProps) => {
  // Состояния
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<(string | null)[]>([]);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomGroups, setRandomGroups] = useState<string[][]>([]);
  const [groupCount, setGroupCount] = useState(3);
  const [includeAbsent, setIncludeAbsent] = useState(false);
  const [divisionMode, setDivisionMode] = useState<'groups' | 'people'>('groups');
  const [peoplePerGroup, setPeoplePerGroup] = useState(2);
  const [isFormingGroups, setIsFormingGroups] = useState(false);
  const [animatingStudent, setAnimatingStudent] = useState<string | null>(null);
  const [selectFromGroup, setSelectFromGroup] = useState<number | null>(null);
  const [groupScores, setGroupScores] = useState<number[]>([]);

  const hasGroups = randomGroups.length > 0;

  // Получаем список студентов с учетом посещаемости
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

  // Создаем карту парных конфликтов
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

  // Рассчитываем оптимальные параметры групп
  const groupStats = useMemo(() => {
    const totalStudents = availableStudents.length;
    if (totalStudents === 0) {
      return {
        min: 2,
        max: 2,
        optimal: [],
        studentsPerGroup: 0,
        remainder: 0,
        actualGroupCount: 0
      };
    }

    const targetSizes = calculateTargetSizes(totalStudents, divisionMode, groupCount, peoplePerGroup);

    if (divisionMode === 'groups') {
      const studentsPerGroup = Math.floor(totalStudents / groupCount);
      const remainder = totalStudents % groupCount;
      return {
        min: 2,
        max: Math.min(totalStudents, 8),
        optimal: targetSizes,
        studentsPerGroup,
        remainder,
        actualGroupCount: groupCount
      };
    } else {
      const actualGroupCount = Math.ceil(totalStudents / peoplePerGroup);
      const remainder = totalStudents % peoplePerGroup;
      return {
        min: 1,
        max: totalStudents,
        optimal: targetSizes,
        studentsPerGroup: peoplePerGroup,
        remainder: remainder > 0 ? 1 : 0,
        actualGroupCount
      };
    }
  }, [availableStudents.length, groupCount, divisionMode, peoplePerGroup]);

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

    for (let i = 0; i < RANDOMIZE_ITERATIONS; i++) {
      const randomIndex = Math.floor(Math.random() * studentsToSelect.length);
      const student = studentsToSelect[randomIndex].name;

      if (!hasGroups) {
        setSelectedStudent(student);
      } else if (groupIndex !== null) {
        setSelectedGroupStudents(prev => {
          const newSelected = [...prev];
          newSelected[groupIndex] = student;
          return newSelected;
        });
      } else {
        setSelectedGroupStudents(randomGroups.map(() => student));
      }

      await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.RANDOMIZE_STEP));
    }

    setIsRandomizing(false);
  }, [availableStudents, randomGroups, hasGroups]);

  const createBalancedGroups = useCallback((students: Student[]): { groups: Student[][], conflicts: number } => {
    const targetSizes = calculateTargetSizes(
      students.length,
      divisionMode,
      groupCount,
      peoplePerGroup
    );

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
            if (hasConflict(student.id, member.id)) {
              conflicts++;
            }
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
    setRandomGroups([]);
    setAnimatingStudent(null);

    setAnimatingStudent('🔍 Анализирую конфликты и создаю группы...');
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.MESSAGE_DISPLAY));

    const result = createBalancedGroups(availableStudents);

    if (result.conflicts === 0) {
      setAnimatingStudent('✨ Идеальное решение найдено без конфликтов!');
    } else {
      setAnimatingStudent(`⚠️ Решение с ${result.conflicts} неизбежным${result.conflicts > 1 ? 'и' : ''} конфликт${result.conflicts > 1 ? 'ами' : 'ом'}`);
    }
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.RESULT_DISPLAY));

    const emptyGroups = Array(result.groups.length).fill(null).map(() => []);
    setRandomGroups(emptyGroups.map(() => []));

    setAnimatingStudent('🎲 Начинаю размещение студентов...');
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.PLACEMENT_STEP + 200));

    const allStudents = result.groups.flat();
    for (let index = 0; index < allStudents.length; index++) {
      const student = allStudents[index];
      const groupIndex = result.groups.findIndex(group =>
        group.some(s => s.id === student.id)
      );

      setAnimatingStudent(`Размещаю: ${student.name} → Группа ${groupIndex + 1}`);

      const currentGroups = result.groups.map((group, gIndex) => {
        if (gIndex < groupIndex) {
          return group.map(s => s.name);
        } else if (gIndex === groupIndex) {
          const currentStudentIndex = group.findIndex(s => s.id === student.id);
          return group.slice(0, currentStudentIndex + 1).map(s => s.name);
        } else {
          return [];
        }
      });

      setRandomGroups(currentGroups);
      await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.PLACEMENT_STEP));
    }

    if (result.conflicts === 0) {
      setAnimatingStudent('🎉 Все группы сформированы без конфликтов!');
    } else {
      setAnimatingStudent(`✅ Группы сбалансированы с минимальными конфликтами`);
    }
    await new Promise(resolve => setTimeout(resolve, ANIMATION_DELAYS.MESSAGE_DISPLAY));

    setAnimatingStudent(null);
    setIsFormingGroups(false);

    const finalNameGroups = result.groups.map(group => group.map(student => student.name));
    setRandomGroups(finalNameGroups);
    setGroupScores(new Array(finalNameGroups.length).fill(0));
    setSelectedGroupStudents(new Array(finalNameGroups.length).fill(null));
    setSelectedStudent(null);
  }, [availableStudents, createBalancedGroups]);

  const handleGroupCountChange = useCallback((newCount: number) => {
    const clampedCount = Math.max(groupStats.min, Math.min(newCount, groupStats.max));
    if (divisionMode === 'groups') {
      setGroupCount(clampedCount);
    } else {
      setPeoplePerGroup(clampedCount);
    }
  }, [groupStats.min, groupStats.max, divisionMode]);

  const updateGroupScore = useCallback((groupIndex: number, change: number) => {
    setGroupScores(prev => {
      const newScores = [...prev];
      newScores[groupIndex] = Math.max(0, (newScores[groupIndex] || 0) + change);
      return newScores;
    });
  }, []);

  const setGroupScoreDirectly = useCallback((groupIndex: number, value: string) => {
    const score = parseInt(value) || 0;
    setGroupScores(prev => {
      const newScores = [...prev];
      newScores[groupIndex] = Math.max(0, score);
      return newScores;
    });
  }, []);

  const resetSelection = useCallback(() => {
    if (hasGroups) {
      setSelectedGroupStudents(new Array(randomGroups.length).fill(null));
    } else {
      setSelectedStudent(null);
    }
  }, [hasGroups, randomGroups.length]);

  useEffect(() => {
    if (!hasGroups && selectedStudent && !availableStudents.some(s => s.name === selectedStudent)) {
      setSelectedStudent(null);
    }
    if (hasGroups && selectedGroupStudents.length > 0 && !availableStudents.some(s => selectedGroupStudents.includes(s.name))) {
      setSelectedGroupStudents([]);
    }
  }, [includeAbsent, selectedStudent, selectedGroupStudents, availableStudents, hasGroups]);

  if (!currentLesson) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Выберите группу для использования рандомайзера</p>
        </div>
      </div>
    );
  }

  const hasSelectedStudent = hasGroups
    ? selectedGroupStudents.some(s => s !== null)
    : selectedStudent !== null;

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Рандомайзер</h2>

      <div className="space-y-6">
        <div className="space-y-4">
          <RandomizerSettings
            includeAbsent={includeAbsent}
            divisionMode={divisionMode}
            groupCount={groupCount}
            peoplePerGroup={peoplePerGroup}
            groupStats={groupStats}
            onIncludeAbsentChange={setIncludeAbsent}
            onDivisionModeChange={setDivisionMode}
            onCountChange={handleGroupCountChange}
          />

          <div className="flex gap-4">
            <button
              onClick={() => randomizeStudent(null)}
              disabled={isRandomizing || availableStudents.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Shuffle size={20} className={isRandomizing && selectFromGroup === null ? 'animate-spin' : ''} />
              {isRandomizing && selectFromGroup === null
                ? 'Выбираю...'
                : hasGroups ? 'Выбрать из всех' : 'Выбрать ученика'}
            </button>

            {hasSelectedStudent && (
              <button
                onClick={resetSelection}
                className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
              >
                Сбросить выбор
              </button>
            )}

            <button
              onClick={divideIntoGroups}
              disabled={availableStudents.length === 0 || isFormingGroups}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Users size={20} className={isFormingGroups ? 'animate-pulse' : ''} />
              {isFormingGroups ? 'Формирую группы...' :
                (divisionMode === 'groups'
                    ? `Разделить на ${groupCount} ${groupCount === 1 ? 'группу' : groupCount < 5 ? 'группы' : 'групп'}`
                    : `Разделить по ${peoplePerGroup} ${peoplePerGroup === 1 ? 'человеку' : peoplePerGroup < 5 ? 'человека' : 'человек'}`
                )
              }
            </button>
          </div>
        </div>

        {isFormingGroups && animatingStudent && (
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg border-2 border-purple-300 animate-pulse">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-800 mb-2">
                {animatingStudent.includes('⚠️') ? '⚠️ Конфликты обнаружены' :
                  animatingStudent.includes('✨') ? '✨ Идеальное решение' :
                    animatingStudent.includes('✅') ? '✅ Готово' :
                      animatingStudent.includes('🎉') ? '🎉 Успешно' :
                        '🎲 Формирование групп'}
              </div>
              <div className="text-purple-700 font-medium">
                {animatingStudent}
              </div>
            </div>
          </div>
        )}

        {!hasGroups ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users size={20} />
              {selectedGroup.groupName} ({availableStudents.length} из {groupData?.students.length} учеников)
            </h3>
            {availableStudents.length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {availableStudents.map((student) => (
                  <div
                    key={student.id}
                    className={`p-2 rounded text-sm transition-all duration-300 ${
                      selectedStudent === student.name
                        ? 'bg-green-200 border-2 border-green-500 scale-105 font-bold'
                        : 'bg-blue-100 hover:bg-blue-200'
                    }`}
                  >
                    {student.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Нет доступных учеников</p>
            )}
          </div>
        ) : (
          <div className={`grid gap-4 ${getGridColumnsClass(randomGroups.length)}`}>
            {randomGroups.map((group, index) => (
              <GroupCard
                key={index}
                groupIndex={index}
                students={group}
                selectedStudent={selectedGroupStudents[index]}
                score={groupScores[index] || 0}
                isRandomizing={isRandomizing}
                isCurrentGroup={selectFromGroup === index}
                onRandomize={randomizeStudent}
                onScoreChange={(change) => updateGroupScore(index, change)}
                onScoreSet={(value) => setGroupScoreDirectly(index, value)}
              />
            ))}
          </div>
        )}
      </div>
      <div className="min-h-60"></div>
    </div>
  );
};

export default RandomizerTab;