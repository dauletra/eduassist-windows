import { useState, useMemo, useEffect } from 'react';
import { Users, Shuffle, Plus, Minus } from 'lucide-react';
import type { Lesson, SelectedGroup, Group, Student } from '../types'

interface RandomizerTabProps {
  selectedGroup: SelectedGroup;
  currentLesson: Lesson | null;
  groupData: Group | null,
  className?: string;
}

const RandomizerTab = ({ selectedGroup, currentLesson, groupData } : RandomizerTabProps) => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [selectedGroupStudents, setSelectedGroupStudents] = useState<(string | null)[]>([]);
  // const [selectedStudents, setSelectedStudents] = useState<(string | null)[]>([]);
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomGroups, setRandomGroups] = useState<string[][]>([]);
  const [groupCount, setGroupCount] = useState(3);
  const [includeAbsent, setIncludeAbsent] = useState(false);
  const [divisionMode, setDivisionMode] = useState<'groups' | 'people'>('groups'); // 'groups' = на N групп, 'people' = по N человек
  const [peoplePerGroup, setPeoplePerGroup] = useState(2);
  // Добавь это состояние в начало компонента
  const [isFormingGroups, setIsFormingGroups] = useState(false);
  const [animatingStudent, setAnimatingStudent] = useState<string | null>(null);
  const [selectFromGroup, setSelectFromGroup] = useState<number | null>(null);
  const [groupScores, setGroupScores] = useState<number[]>([]);

  // Добавь функции для управления баллами
  const updateGroupScore = (groupIndex: number, change: number) => {
    setGroupScores(prev => {
      const newScores = [...prev];
      newScores[groupIndex] = Math.max(0, (newScores[groupIndex] || 0) + change);
      return newScores;
    });
  };

  const setGroupScoreDirectly = (groupIndex: number, value: string) => {
    const score = parseInt(value) || 0;
    setGroupScores(prev => {
      const newScores = [...prev];
      newScores[groupIndex] = Math.max(0, score);
      return newScores;
    });
  };

  // Получаем список студентов с учетом посещаемости
  const availableStudents = useMemo(() => {
    if (!currentLesson?.students || !groupData) return [];

    // Создаем карту посещаемости по ID студентов из урока
    const attendanceMap = new Map();
    currentLesson.students.forEach(student => {
      attendanceMap.set(student.id, student.attendance);
    });

    // Фильтруем студентов группы по посещаемости
    return groupData.students.filter(student => {
      if (includeAbsent) return true;

      // Проверяем посещаемость по ID студента
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

      if (!map.has(studentId1)) {
        map.set(studentId1, new Set());
      }
      if (!map.has(studentId2)) {
        map.set(studentId2, new Set());
      }

      map.get(studentId1)!.add(studentId2);
      map.get(studentId2)!.add(studentId1);
    });

    return map;
  }, [groupData]);

  // Проверяет, есть ли конфликт между двумя студентами
  const hasConflict = (studentId1: string, studentId2: string): boolean => {
    return conflictMap.get(studentId1)?.has(studentId2) ?? false;
  };

  // Подсчет конфликтов в группах
  const countConflicts = (groups: Student[][]): number => {
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
  };

  // Рассчитываем оптимальные параметры групп
  const groupStats = useMemo(() => {
    const totalStudents = availableStudents.length;
    if (totalStudents === 0) return {
      min: 2,
      max: 2,
      optimal: [],
      studentsPerGroup: 0,
      remainder: 0,
      actualGroupCount: 0
    };

    if (divisionMode === 'groups') {
      const min = 2;
      const max = Math.min(totalStudents, 8);
      const studentsPerGroup = Math.floor(totalStudents / groupCount);
      const remainder = totalStudents % groupCount;

      const optimal = Array(groupCount).fill(studentsPerGroup);
      for (let i = 0; i < remainder; i++) {
        optimal[i]++;
      }

      return { min, max, optimal, studentsPerGroup, remainder, actualGroupCount: groupCount };
    } else {
      const min = 1;
      const max = totalStudents;
      const actualGroupCount = Math.ceil(totalStudents / peoplePerGroup);
      const remainder = totalStudents % peoplePerGroup;

      const optimal = Array(actualGroupCount).fill(peoplePerGroup);
      if (remainder > 0) {
        optimal[optimal.length - 1] = remainder;
      }

      return {
        min,
        max,
        optimal,
        studentsPerGroup: peoplePerGroup,
        remainder: remainder > 0 ? 1 : 0,
        actualGroupCount
      };
    }
  }, [availableStudents.length, groupCount, divisionMode, peoplePerGroup]);

  // Измени функцию randomizeStudent:
  const randomizeStudent = async (groupIndex: number | null = null) => {
    if (!availableStudents.length) return;

    setIsRandomizing(true);
    setSelectFromGroup(groupIndex);

    const studentsToSelect = groupIndex !== null
      ? randomGroups[groupIndex].map(name => availableStudents.find(s => s.name === name)!).filter(Boolean)
      : availableStudents;

    if (studentsToSelect.length === 0) return;

    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * studentsToSelect.length);
      const student = studentsToSelect[randomIndex].name;

      if (randomGroups.length === 0) {
        // Режим без групп
        setSelectedStudent(student);
      } else if (groupIndex !== null) {
        // Выбор из конкретной группы
        setSelectedGroupStudents(prev => {
          const newSelected = [...prev];
          newSelected[groupIndex] = student;
          return newSelected;
        });
      } else {
        // Выбор из всех групп
        setSelectedGroupStudents(randomGroups.map(() => student));
      }

      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRandomizing(false);
  };

  // Детерминированный алгоритм разделения с backtracking
  const createBalancedGroups = (students: Student[]): { groups: Student[][], conflicts: number } => {
    const totalGroups = divisionMode === 'groups' ? groupCount : Math.ceil(students.length / peoplePerGroup);
    const groups: Student[][] = Array(totalGroups).fill(null).map(() => []);

    // Вычисляем целевые размеры групп
    const targetSizes: number[] = [];
    if (divisionMode === 'groups') {
      const base = Math.floor(students.length / groupCount);
      const remainder = students.length % groupCount;
      for (let i = 0; i < groupCount; i++) {
        targetSizes.push(base + (i < remainder ? 1 : 0));
      }
    } else {
      let remaining = students.length;
      while (remaining > 0) {
        targetSizes.push(Math.min(peoplePerGroup, remaining));
        remaining -= peoplePerGroup;
      }
    }

    // Перемешиваем студентов для случайности
    const shuffled = [...students].sort(() => Math.random() - 0.5);

    // Рекурсивная функция размещения с возвратом
    const placeStudent = (index: number): boolean => {
      if (index === shuffled.length) {
        return true; // Все размещены
      }

      const student = shuffled[index];

      for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
        // Проверяем, не превышен ли размер группы
        if (groups[groupIndex].length >= targetSizes[groupIndex]) {
          continue;
        }

        // Проверяем конфликты в этой группе
        let hasConflictInGroup = false;
        for (const member of groups[groupIndex]) {
          if (hasConflict(student.id, member.id)) {
            hasConflictInGroup = true;
            break;
          }
        }

        if (!hasConflictInGroup) {
          // Размещаем студента
          groups[groupIndex].push(student);

          // Пробуем разместить следующего
          if (placeStudent(index + 1)) {
            return true;
          }

          // Откатываем, если не получилось
          groups[groupIndex].pop();
        }
      }

      return false; // Не удалось разместить без конфликтов
    };

    // Пробуем разместить детерминированно
    const success = placeStudent(0);

    if (!success) {
      // Если не удалось без конфликтов, используем жадный алгоритм с минимизацией конфликтов
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
  };

  // Анимированное разделение на группы
  const divideIntoGroups = async () => {
    if (!availableStudents.length) return;
    // setSelectedStudent(null)  // Сам добавил чтобы при делении на группы сбросить выбранного студента

    setIsFormingGroups(true);
    setRandomGroups([]);
    setAnimatingStudent(null);

    // Показываем процесс
    setAnimatingStudent('🔍 Анализирую конфликты и создаю группы...');
    await new Promise(resolve => setTimeout(resolve, 800));

    // Создаем сбалансированные группы
    const result = createBalancedGroups(availableStudents);

    // Показываем результат
    if (result.conflicts === 0) {
      setAnimatingStudent('✨ Идеальное решение найдено без конфликтов!');
    } else {
      setAnimatingStudent(`⚠️ Решение с ${result.conflicts} неизбежным${result.conflicts > 1 ? 'и' : ''} конфликт${result.conflicts > 1 ? 'ами' : 'ом'}`);
    }
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Создаем пустые группы для отображения
    const emptyGroups = Array(result.groups.length).fill(null).map(() => []);
    setRandomGroups(emptyGroups.map(() => []));

    setAnimatingStudent('🎲 Начинаю размещение студентов...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Анимация размещения
    const allStudents = result.groups.flat();
    for (let index = 0; index < allStudents.length; index++) {
      const student = allStudents[index];
      const groupIndex = result.groups.findIndex(group =>
        group.some(s => s.id === student.id)
      );

      setAnimatingStudent(`Размещаю: ${student.name} → Группа ${groupIndex + 1}`);

      const finalNameGroups  = result.groups.map((group, gIndex) => {
        if (gIndex < groupIndex) {
          return group.map(s => s.name);
        } else if (gIndex === groupIndex) {
          const currentStudentIndex = group.findIndex(s => s.id === student.id);
          return group.slice(0, currentStudentIndex + 1).map(s => s.name);
        } else {
          return [];
        }
      });

      setRandomGroups(finalNameGroups );
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Финальное сообщение
    if (result.conflicts === 0) {
      setAnimatingStudent('🎉 Все группы сформированы без конфликтов!');
    } else {
      setAnimatingStudent(`✅ Группы сбалансированы с минимальными конфликтами`);
    }
    await new Promise(resolve => setTimeout(resolve, 800));

    setAnimatingStudent(null);
    setIsFormingGroups(false);

    const finalNameGroups = result.groups.map(group => group.map(student => student.name));
    setRandomGroups(finalNameGroups);
    // setSelectedStudents(new Array(finalNameGroups.length).fill(null)); // Добавь эту строку
    setGroupScores(new Array(finalNameGroups.length).fill(0)); // Добавь эту строку
    setSelectedGroupStudents(new Array(finalNameGroups.length).fill(null));
    setSelectedStudent(null);
  };

  const handleGroupCountChange = (newCount: number) => {
    const clampedCount = Math.max(groupStats.min, Math.min(newCount, groupStats.max));
    if (divisionMode === 'groups') {
      setGroupCount(clampedCount);
    } else {
      setPeoplePerGroup(clampedCount);
    }

  };

  // Сбрасываем выбранного студента при изменении настроек
  useEffect(() => {
    if (selectedStudent && !availableStudents.some(s => s.name === selectedStudent)) {
      setSelectedStudent(null);
    }
    if (selectedGroupStudents.length > 0 && !availableStudents.some(s => selectedGroupStudents.includes(s.name))) {
      setSelectedGroupStudents([]);
    }
  }, [includeAbsent, selectedStudent, selectedGroupStudents, availableStudents]);

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

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Рандомайзер</h2>

      <div className="space-y-6">

        <div className="space-y-4">
          {/* Настройки */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3 text-gray-700">Настройки групп</h4>

            {/* Включение отсутствующих */}
            <div className="flex items-center gap-3 mb-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAbsent}
                  onChange={(e) => {
                    setIncludeAbsent(e.target.checked);
                    // setRandomGroups([]);
                  }}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">
                  Включать отсутствующих в рандомайзер
                </span>
              </label>
            </div>

            {/* Режим разделения */}
            <div className="mb-4">
              <span className="text-sm text-gray-600 block mb-2">Режим разделения:</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setDivisionMode('groups')}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    divisionMode === 'groups'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  На количество групп
                </button>
                <button
                  onClick={() => setDivisionMode('people')}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    divisionMode === 'people'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  По количеству человек
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {divisionMode === 'groups' ? 'Количество групп:' : 'Человек в группе:'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGroupCountChange((divisionMode === 'groups' ? groupCount : peoplePerGroup) - 1)}
                  disabled={(divisionMode === 'groups' ? groupCount : peoplePerGroup) <= groupStats.min}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-medium">
                  {divisionMode === 'groups' ? groupCount : peoplePerGroup}
                </span>
                <button
                  onClick={() => handleGroupCountChange((divisionMode === 'groups' ? groupCount : peoplePerGroup) + 1)}
                  disabled={(divisionMode === 'groups' ? groupCount : peoplePerGroup) >= groupStats.max}
                  className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              <span className="text-xs text-gray-500">
                {divisionMode === 'groups'
                  ? `По ${groupStats.studentsPerGroup}${groupStats.remainder > 0 ? `-${groupStats.studentsPerGroup + 1}` : ''} человек в группе`
                  : `Получится ${groupStats.actualGroupCount} ${groupStats.actualGroupCount === 1 ? 'группа' : groupStats.actualGroupCount < 5 ? 'группы' : 'групп'}`
                }
              </span>
            </div>

            { /* groupData?.conflicts && groupData.conflicts.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800 font-medium mb-1">
                  ⚠️ Учитываются конфликты между студентами
                </p>
                <p className="text-xs text-yellow-700">
                  {groupData.conflicts.length} {groupData.conflicts.length === 1 ? 'конфликт' : 'конфликта'} настроено
                </p>
              </div>
            ) */}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-4">
            {randomGroups.length === 0 ? (
              <>
                <button
                  onClick={() => randomizeStudent(null)}
                  disabled={isRandomizing || availableStudents.length === 0}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <Shuffle size={20} className={isRandomizing ? 'animate-spin' : ''} />
                  {isRandomizing ? 'Выбираю...' : 'Выбрать ученика'}
                </button>

                {randomGroups.length === 0 ? (
                  selectedStudent && (
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                    >
                      Сбросить выбор
                    </button>
                  )
                ) : (
                  selectedGroupStudents.some(s => s !== null) && (
                    <button
                      onClick={() => setSelectedGroupStudents(new Array(randomGroups.length).fill(null))}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                    >
                      Сбросить выбор
                    </button>
                  )
                )}
              </>
            ) : (
              <>
                <button
                  onClick={() => randomizeStudent(null)}
                  disabled={isRandomizing || availableStudents.length === 0}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
                >
                  <Shuffle size={20} className={isRandomizing && selectFromGroup === null ? 'animate-spin' : ''} />
                  {isRandomizing && selectFromGroup === null ? 'Выбираю...' : 'Выбрать из всех'}
                </button>

                {randomGroups.length === 0 ? (
                  selectedStudent && (
                    <button
                      onClick={() => setSelectedStudent(null)}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                    >
                      Сбросить выбор
                    </button>
                  )
                ) : (
                  selectedGroupStudents.some(s => s !== null) && (
                    <button
                      onClick={() => setSelectedGroupStudents(new Array(randomGroups.length).fill(null))}
                      className="bg-gray-500 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-all duration-200 flex items-center gap-2"
                    >
                      Сбросить выбор
                    </button>
                  )
                )}
              </>
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

        {/* Анимация формирования групп */}
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

        {/* Показываем либо список учеников, либо группы */}
        {randomGroups.length === 0 ? (
          // Список учеников
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
          <div className={`grid gap-4 ${
            randomGroups.length <= 3 ? 'grid-cols-3' :
              randomGroups.length <= 4 ? 'grid-cols-4' :
                randomGroups.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
          }`}>
            {randomGroups.map((group, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-purple-800 flex items-center gap-2">
                    Группа {index + 1}
                    <span className="text-xs font-normal text-purple-600">
              ({group.length} чел.)
            </span>
                  </h4>
                  <button
                    onClick={() => randomizeStudent(index)}
                    disabled={isRandomizing || group.length === 0}
                    className="p-1 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
                    title="Выбрать из этой группы"
                  >
                    <Shuffle size={16} className={isRandomizing && selectFromGroup === index ? 'animate-spin' : ''} />
                  </button>
                </div>

                {/* Баллы группы */}
                <div className="mb-3 p-2 bg-white rounded-lg border-2 border-purple-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-purple-700">Баллы:</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateGroupScore(index, -1)}
                        className="p-1 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={groupScores[index] || 0}
                        onChange={(e) => setGroupScoreDirectly(index, e.target.value)}
                        className="w-16 text-center border border-purple-300 rounded px-1 py-0.5 text-lg font-bold text-purple-800"
                        min="0"
                      />
                      <button
                        onClick={() => updateGroupScore(index, 1)}
                        className="p-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {group.map((student, idx) => (
                  <div
                    key={idx}
                    className={`text-lg py-1 transition-all duration-300 ${
                      selectedGroupStudents[index] === student
                        ? 'text-green-600 font-bold scale-105'
                        : 'text-gray-700'
                    }`}
                  >
                    {student}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

      </div>
      <div className="min-h-60"></div>
    </div>
  );
};

export default RandomizerTab;