// src/render/components/RandomizerTab/index.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, Shuffle } from 'lucide-react';
import type { Lesson, SelectedGroup, Group } from '../../types';
import { GroupCard } from './GroupCard';
import { RandomizerSettings } from './RandomizerSettings';
import { getGridColumnsClass } from './utils';
import { useRandomizer } from './useRandomizer';
import { useGroupFormation } from './useGroupFormation';

interface RandomizerTabProps {
  selectedGroup: SelectedGroup;
  currentLesson: Lesson | null;
  groupData: Group | null;
  className?: string;
}

const RandomizerTab = ({ selectedGroup, currentLesson, groupData }: RandomizerTabProps) => {
  const [groupCount, setGroupCount] = useState(3);
  const [includeAbsent, setIncludeAbsent] = useState(false);
  const [divisionMode, setDivisionMode] = useState<'groups' | 'people'>('groups');
  const [peoplePerGroup, setPeoplePerGroup] = useState(2);
  const [groupScores, setGroupScores] = useState<number[]>([]);

  const {
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
    clearHistory
  } = useRandomizer({ currentLesson, groupData, includeAbsent });

  const handleGroupsCreated = useCallback((groups: string[][], scores: number[]) => {
    setRandomGroups(groups);
    setGroupScores(scores);
    setSelectedGroupStudents(new Array(groups.length).fill(null));
    setSelectedStudent(null);
    clearHistory();
  }, [setRandomGroups, setSelectedGroupStudents, setSelectedStudent, clearHistory]);

  const { isFormingGroups, animatingStudent, divideIntoGroups } = useGroupFormation({
    availableStudents,
    divisionMode,
    groupCount,
    peoplePerGroup,
    hasConflict,
    onGroupsCreated: handleGroupsCreated,
  });

  const groupStats = useMemo(() => {
    const totalStudents = availableStudents.length;
    if (totalStudents === 0) {
      return { min: 2, max: 2, optimal: [], studentsPerGroup: 0, remainder: 0, actualGroupCount: 0 };
    }

    if (divisionMode === 'groups') {
      const studentsPerGroup = Math.floor(totalStudents / groupCount);
      const remainder = totalStudents % groupCount;
      return {
        min: 2,
        max: Math.min(totalStudents, 8),
        optimal: [],
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
        optimal: [],
        studentsPerGroup: peoplePerGroup,
        remainder: remainder > 0 ? 1 : 0,
        actualGroupCount
      };
    }
  }, [availableStudents.length, groupCount, divisionMode, peoplePerGroup]);

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

  // Очистка истории при изменении параметров фильтрации
  useEffect(() => {
    clearHistory();
  }, [includeAbsent, clearHistory]);


  useEffect(() => {
    if (!hasGroups && selectedStudent && !availableStudents.some(s => s.name === selectedStudent)) {
      setSelectedStudent(null);
    }
    if (hasGroups && selectedGroupStudents.length > 0 && !availableStudents.some(s => selectedGroupStudents.includes(s.name))) {
      setSelectedGroupStudents([]);
    }
  }, [includeAbsent, selectedStudent, selectedGroupStudents, availableStudents, hasGroups, setSelectedStudent, setSelectedGroupStudents]);

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