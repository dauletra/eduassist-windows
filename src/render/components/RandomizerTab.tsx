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
  const [isRandomizing, setIsRandomizing] = useState(false);
  const [randomGroups, setRandomGroups] = useState<string[][]>([]);
  const [groupCount, setGroupCount] = useState(3);
  const [includeAbsent, setIncludeAbsent] = useState(false);
  const [divisionMode, setDivisionMode] = useState<'groups' | 'people'>('groups'); // 'groups' = на N групп, 'people' = по N человек
  const [peoplePerGroup, setPeoplePerGroup] = useState(2);
  // Добавь это состояние в начало компонента
  const [isFormingGroups, setIsFormingGroups] = useState(false);
  const [animatingStudent, setAnimatingStudent] = useState<string | null>(null);

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

  // Создаем карту конфликтов (по ID студентов)
  const conflictMap = useMemo(() => {
    if (!groupData?.conflicts) return new Map();

    const map = new Map<string, Set<string>>();

    groupData.conflicts.forEach(conflict => {
      conflict.students.forEach(studentId1 => {
        if (!map.has(studentId1)) {
          map.set(studentId1, new Set());
        }
        conflict.students.forEach(studentId2 => {
          if (studentId1 !== studentId2) {
            map.get(studentId1)!.add(studentId2);
          }
        });
      });
    });

    return map;
  }, [groupData]);

  // Проверяет, есть ли конфликт между двумя студентами (по ID)
  const hasConflict = (studentId1: string, studentId2: string): boolean => {
    return conflictMap.get(studentId1)?.has(studentId2) ?? false;
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


  const randomizeStudent = async () => {
    if (!availableStudents.length) return;

    setIsRandomizing(true);
    setSelectedStudent(null);

    // Анимация рандомизации
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * availableStudents.length);
      setSelectedStudent(availableStudents[randomIndex].name);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsRandomizing(false);
  };

  // Улучшенный алгоритм разделения с учетом конфликтов
  const divideIntoGroups = async () => {
    if (!availableStudents.length) return;

    setIsFormingGroups(true);
    setRandomGroups([]);
    setAnimatingStudent(null);

    const shuffled = [...availableStudents].sort(() => Math.random() - 0.5);
    let groups: Student[][];

    if (divisionMode === 'groups') {
      groups = Array(groupCount).fill(null).map(() => []);
    } else {
      groups = [];
    }

    // Создаем пустые группы для отображения
    const emptyGroupsCount = divisionMode === 'groups' ? groupCount : Math.ceil(shuffled.length / peoplePerGroup);
    const emptyGroups = Array(emptyGroupsCount).fill(null).map(() => []);
    setRandomGroups(emptyGroups.map(() => []));

    // Показываем перемешивание студентов
    for (let i = 0; i < 5; i++) {
      const randomStudent = shuffled[Math.floor(Math.random() * shuffled.length)];
      setAnimatingStudent(randomStudent.name);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    setAnimatingStudent(null);

    // Анимация размещения студентов
    for (let index = 0; index < shuffled.length; index++) {
      const student = shuffled[index];

      // Показываем какой студент сейчас размещается
      setAnimatingStudent(student.name);
      await new Promise(resolve => setTimeout(resolve, 400));

      if (divisionMode === 'groups') {
        const groupIndex = index % groupCount;
        groups[groupIndex].push(student);
      } else {
        const groupIndex = Math.floor(index / peoplePerGroup);
        if (!groups[groupIndex]) {
          groups[groupIndex] = [];
        }
        groups[groupIndex].push(student);
      }

      // Обновляем отображение
      const nameGroups = groups
        .filter(group => group.length > 0)
        .map(group => group.map(student => student.name));

      setRandomGroups(nameGroups);
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    setAnimatingStudent(null);

    // Анимация разрешения конфликтов
    for (let i = 0; i < groups.length; i++) {
      for (let j = 0; j < groups[i].length; j++) {
        for (let k = j + 1; k < groups[i].length; k++) {
          if (hasConflict(groups[i][j].id, groups[i][k].id)) {
            // Показываем конфликт
            setAnimatingStudent(`${groups[i][j].name} ⚡ ${groups[i][k].name}`);
            await new Promise(resolve => setTimeout(resolve, 600));

            for (let targetGroup = 0; targetGroup < groups.length; targetGroup++) {
              if (targetGroup !== i) {
                const studentToMove = groups[i].splice(k, 1)[0];
                groups[targetGroup].push(studentToMove);
                k--;

                // Показываем перемещение
                setAnimatingStudent(`${studentToMove.name} → Группа ${targetGroup + 1}`);

                const nameGroups = groups
                  .filter(group => group.length > 0)
                  .map(group => group.map(student => student.name));
                setRandomGroups(nameGroups);
                await new Promise(resolve => setTimeout(resolve, 500));
                break;
              }
            }
            break;
          }
        }
      }
    }

    setAnimatingStudent(null);
    setIsFormingGroups(false);

    // Финальное обновление
    const finalNameGroups = groups
      .filter(group => group.length > 0)
      .map(group => group.map(student => student.name));
    setRandomGroups(finalNameGroups);
  };

  const handleGroupCountChange = (newCount: number) => {
    const clampedCount = Math.max(groupStats.min, Math.min(newCount, groupStats.max));
    if (divisionMode === 'groups') {
      setGroupCount(clampedCount);
    } else {
      setPeoplePerGroup(clampedCount);
    }
    setRandomGroups([]);
  };

  // Сбрасываем выбранного студента при изменении настроек
  useEffect(() => {
    if (selectedStudent && !availableStudents.some(s => s.name === selectedStudent)) {
      setSelectedStudent(null);
    }
  }, [includeAbsent, selectedStudent, availableStudents]);

  // Очищаем группы при смене режима разделения
  useEffect(() => {
    setRandomGroups([]);
  }, [divisionMode]);

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
                    setRandomGroups([]);
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

            {/* Информация о конфликтах */}
            {groupData?.conflicts && groupData.conflicts.length > 0 && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-xs text-yellow-800 font-medium mb-1">
                  ⚠️ Учитываются конфликты между студентами
                </p>
                <p className="text-xs text-yellow-700">
                  {groupData.conflicts.length} {groupData.conflicts.length === 1 ? 'конфликт' : 'конфликта'} настроено
                </p>
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-4">
            <button
              onClick={randomizeStudent}
              disabled={isRandomizing || availableStudents.length === 0}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              <Shuffle size={20} className={isRandomizing ? 'animate-spin' : ''} />
              {isRandomizing ? 'Выбираю...' : 'Выбрать ученика'}
            </button>

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
                {animatingStudent.includes('⚡') ? '⚡ Обнаружен конфликт!' :
                  animatingStudent.includes('→') ? '🔄 Перемещение студента' :
                    '🎲 Размещаю студента'}
              </div>
              <div className="text-purple-700 font-medium">
                {animatingStudent}
              </div>
            </div>
          </div>
        )}

        {/* Отображение групп */}
        {randomGroups.length > 0 && (
          <div className={`grid gap-4 ${
            randomGroups.length <= 3 ? 'grid-cols-3' :
              randomGroups.length <= 4 ? 'grid-cols-4' :
                randomGroups.length <= 6 ? 'grid-cols-3' : 'grid-cols-4'
          }`}>
            {randomGroups.map((group, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800 mb-2 flex items-center justify-between">
                  Группа {index + 1}
                  <span className="text-xs font-normal text-purple-600">
                    ({group.length} чел.)
                  </span>
                </h4>
                {group.map((student, idx) => (
                  <div key={idx} className="text-xl text-gray-700 py-1">{student}</div>
                ))}
              </div>
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
};

export default RandomizerTab;