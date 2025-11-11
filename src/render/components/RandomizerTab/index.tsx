// src/render/components/RandomizerTab/index.tsx

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Users, Shuffle } from 'lucide-react';
import { GroupCard } from './GroupCard';
import { RandomizerSettings } from './RandomizerSettings';
import { useAppState } from '../../contexts/StoreContext';
import { useCommands } from "../../hooks/useCommands.ts";
import { voiceCommandBus } from "../../services/CommandEventBus.ts";

const GRID_COLS_MAP = {
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  6: 'grid-cols-3',
  default: 'grid-cols-4',
} as const;

const getGridColumnsClass = (groupCount: number): string => {
  if (groupCount <= 3) return GRID_COLS_MAP[3];
  if (groupCount <= 4) return GRID_COLS_MAP[4];
  if (groupCount <= 6) return GRID_COLS_MAP[6];
  return GRID_COLS_MAP.default;
};

const RandomizerTab = () => {
  const state = useAppState();
  const { selectedGroup, currentLesson, currentGroup } = state;
  const commands = useCommands();

  // ТОЛЬКО UI состояние
  const [groupCount, setGroupCount] = useState(3);
  const [includeAbsent, setIncludeAbsent] = useState(false);
  const [divisionMode, setDivisionMode] = useState<'groups' | 'people'>('groups');
  const [peoplePerGroup, setPeoplePerGroup] = useState(2);
  const [groupScores, setGroupScores] = useState<number[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<(string | null)[]>([]);
  const [randomGroups, setRandomGroups] = useState<string[][]>([]);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [isFormingGroups, setIsFormingGroups] = useState(false);
  const [animatingStudent, setAnimatingStudent] = useState<string | null>(null);

  const hasGroups = randomGroups.length > 0;

  // Простая логика для UI
  const availableStudents = useMemo(() => {
    if (!currentLesson?.students || !currentGroup) return [];

    const attendanceMap = new Map();
    currentLesson.students.forEach(student => {
      attendanceMap.set(student.id, student.attendance);
    });

    return currentGroup.students.filter(student => {
      if (includeAbsent) return true;
      const attendance = attendanceMap.get(student.id) ?? true;
      return attendance;
    });
  }, [currentLesson, currentGroup, includeAbsent]);

  const groupStats = useMemo(() => {
    const totalStudents = availableStudents.length;
    if (totalStudents === 0) {
      return { min: 2, max: 2, studentsPerGroup: 0, remainder: 0, actualGroupCount: 0 };
    }

    if (divisionMode === 'groups') {
      const studentsPerGroup = Math.floor(totalStudents / groupCount);
      const remainder = totalStudents % groupCount;
      return {
        min: 2,
        max: Math.min(totalStudents, 8),
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

  // Обработчики - ТОЛЬКО вызов команд
  const handleRandomStudentClick = useCallback(async () => {
    console.log('🖱️ UI: Random student button clicked');
    setIsRandomizing(true);

    const result = await commands.randomStudent(!includeAbsent);

    if (!result.success) {
      console.error('❌ Random student failed:', result.message);
    }

    setIsRandomizing(false);
  }, [commands, includeAbsent]);

  const handleDivideGroupsClick = useCallback(async () => {
    console.log('🖱️ UI: Divide groups button clicked');
    setIsFormingGroups(true);
    setAnimatingStudent('🎲 Формирую группы...');

    try {
      let result;
      if (divisionMode === 'groups') {
        result = await commands.divideByGroupCount(groupCount, !includeAbsent);
      } else {
        result = await commands.divideByGroupSize(peoplePerGroup, !includeAbsent);
      }

      // ✅ ВРУЧНУЮ обновляем состояние после успешного выполнения команды
      if (result.success && result.data?.groups) {
        const groupsAsNames = result.data.groups.map((group: any[]) =>
          group.map((student: any) => student.name)
        );

        setRandomGroups(groupsAsNames);
        setGroupScores(new Array(groupsAsNames.length).fill(0));
        setSelectedGroupStudents(new Array(groupsAsNames.length).fill(null));
        setSelectedStudent(null);
        setAnimatingStudent('✅ Группы созданы!');

        setTimeout(() => {
          setAnimatingStudent(null);
        }, 2000);
      } else if (!result.success) {
        console.error('❌ Divide groups failed:', result.message);
        setAnimatingStudent(`❌ Ошибка: ${result.message}`);

        setTimeout(() => {
          setAnimatingStudent(null);
        }, 3000);
      }
    } catch (error) {
      console.error('❌ Divide groups failed:', error);
      setAnimatingStudent('❌ Ошибка при формировании групп');

      setTimeout(() => {
        setAnimatingStudent(null);
      }, 3000);
    } finally {
      setIsFormingGroups(false);
    }
  }, [commands, divisionMode, groupCount, peoplePerGroup, includeAbsent]);

  // Простая анимация выбора внутри группы
  const randomizeStudent = useCallback(async (groupIndex: number) => {
    if (!hasGroups || !randomGroups[groupIndex]?.length) return;

    setIsRandomizing(true);

    // Простая анимация
    const students = randomGroups[groupIndex];
    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * students.length);
      setSelectedGroupStudents(prev => {
        const newSelected = [...prev];
        newSelected[groupIndex] = students[randomIndex];
        return newSelected;
      });
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Финальный выбор
    const finalIndex = Math.floor(Math.random() * students.length);
    setSelectedGroupStudents(prev => {
      const newSelected = [...prev];
      newSelected[groupIndex] = students[finalIndex];
      return newSelected;
    });

    setIsRandomizing(false);
  }, [hasGroups, randomGroups]);

  const resetSelection = useCallback(() => {
    if (hasGroups) {
      setSelectedGroupStudents(new Array(randomGroups.length).fill(null));
    } else {
      setSelectedStudent(null);
    }
  }, [hasGroups, randomGroups.length]);

  useEffect(() => {
    const unsubscribeRandom = voiceCommandBus.subscribe('random_student_selected', (data) => {
      console.log('🎲 random_student_selected event:', data);
      if (data?.studentName) {
        setSelectedStudent(data.studentName);

        const studentName = data.studentName || 'Ученик';
        // Добавьте анимацию или уведомление
        setAnimatingStudent(`🎯 Выбран: ${studentName}`);

        setTimeout(() => {
          setAnimatingStudent(null);
        }, 3000);
      }
    });

    const unsubscribeGroups = voiceCommandBus.subscribe('groups_formed', (data: any) => {
      console.log('👥 groups_formed event received:', data);

      // ✅ Обрабатываем данные из вашего JSON
      if (data?.groups && Array.isArray(data.groups)) {
        console.log('📊 Processing groups data:', {
          groupCount: data.groups.length,
          method: data.method,
          groupSize: data.groupSize
        });

        // Преобразуем группы в формат для UI
        const groupsAsNames = data.groups.map((group: any[]) =>
          group.map((student: any) => {
            // Обрабатываем оба формата: с name и без
            if (typeof student === 'string') {
              return student;
            } else if (student && typeof student === 'object') {
              return student.name || `Ученик ${student.id}`;
            }
            return 'Неизвестный ученик';
          })
        );

        console.log('🎯 Setting randomGroups:', groupsAsNames);

        setRandomGroups(groupsAsNames);
        setGroupScores(new Array(groupsAsNames.length).fill(0));
        setSelectedGroupStudents(new Array(groupsAsNames.length).fill(null));
        setSelectedStudent(null);
        setAnimatingStudent('✅ Группы созданы!');

        setTimeout(() => {
          setAnimatingStudent(null);
        }, 2000);
      } else {
        console.warn('⚠️ Invalid groups data received:', data);
      }
    });

    return () => {
      unsubscribeRandom();
      unsubscribeGroups();
    };
  }, []);

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

      {selectedStudent && (
        <div className="bg-gradient-to-r from-green-100 to-blue-100 p-4 my-4 rounded-lg border-2 border-green-300 animate-pulse">
          <div className="text-center">
            <div className="text-lg font-bold text-green-800 mb-2">
              🎯 Выбран ученик
            </div>
            <div className="text-green-700 font-medium text-xl">
              {selectedStudent}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {!hasGroups ? (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users size={20} />
              {selectedGroup?.groupName} ({availableStudents.length} из {currentGroup?.students.length} учеников)
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
                isCurrentGroup={false}
                onRandomize={randomizeStudent}
                onScoreChange={(change) => updateGroupScore(index, change)}
                onScoreSet={(value) => setGroupScoreDirectly(index, value)}
              />
            ))}
          </div>
        )}
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              onClick={handleRandomStudentClick}
              disabled={isRandomizing || availableStudents.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Shuffle size={20} className={isRandomizing ? 'animate-spin' : ''} />
              {isRandomizing
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
              onClick={handleDivideGroupsClick}
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
      </div>
      <div className="min-h-60"></div>
    </div>
  );
};

export default RandomizerTab;