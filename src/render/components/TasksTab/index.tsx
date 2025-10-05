// src/render/components/TasksTab/index.tsx

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Settings, CheckCircle2, XCircle, Circle, Minus } from 'lucide-react';
import type { Lesson, SelectedGroup, Group, TaskStatus } from '../../types';

interface TasksTabProps {
  selectedGroup: SelectedGroup;
  currentLesson: Lesson | null;
  groupData: Group | null;
  className?: string;
}

interface StudentTasks {
  studentId: string;
  tasks: TaskStatus[];
}

const TasksTab = ({ selectedGroup, currentLesson, groupData }: TasksTabProps) => {
  const [taskCount, setTaskCount] = useState(10);
  const [showSettings, setShowSettings] = useState(false);
  const [tempTaskCount, setTempTaskCount] = useState(10);
  const [studentTasks, setStudentTasks] = useState<StudentTasks[]>([]);

  // Инициализация данных при загрузке урока
  useEffect(() => {
    if (!currentLesson || !groupData) {
      setStudentTasks([]);
      return;
    }

    // Загружаем сохраненные задания из урока
    const initialTasks: StudentTasks[] = groupData.students.map(student => {
      const lessonStudent = currentLesson.students.find(s => s.id === student.id);
      const savedTasks = lessonStudent?.tasks || [];

      // Расширяем или обрезаем массив до нужного размера
      const tasks = new Array(taskCount).fill(0).map((_, i) =>
        savedTasks[i] !== undefined ? savedTasks[i] : 0
      ) as TaskStatus[];

      return {
        studentId: student.id,
        tasks
      };
    });

    setStudentTasks(initialTasks);
  }, [currentLesson, groupData, taskCount]);

  // Переключение состояния задания
  const toggleTaskStatus = useCallback(async (studentId: string, taskIndex: number) => {
    if (!currentLesson) return;

    setStudentTasks(prev =>
      prev.map(st => {
        if (st.studentId !== studentId) return st;

        const newTasks = [...st.tasks];
        // Циклическое переключение: 0 -> 1 -> 2 -> 3 -> 0
        const newStatus = ((newTasks[taskIndex] + 1) % 4) as TaskStatus;
        newTasks[taskIndex] = newStatus;

        // Сохраняем изменение в backend
        window.electronAPI.updateTaskStatus(
          currentLesson.id,
          studentId,
          taskIndex,
          newStatus
        )
        //   .catch(error => {
        //   console.error('Ошибка сохранения статуса задания:', error);
        // });

        return { ...st, tasks: newTasks };
      })
    );
  }, [currentLesson]);

  // Изменить статус конкретного задания для всех учеников
  const setAllTasksStatus = useCallback(async (taskIndex: number) => {
    if (!currentLesson) return;

    // Определяем следующий статус: берем первый статус и переключаем
    const firstStatus = studentTasks[0]?.tasks[taskIndex] || 0;
    const nextStatus = ((firstStatus + 1) % 4) as TaskStatus;

    setStudentTasks(prev =>
      prev.map(st => {
        const newTasks = [...st.tasks];
        newTasks[taskIndex] = nextStatus;

        // Сохраняем для каждого ученика
        window.electronAPI.updateTaskStatus(
          currentLesson.id,
          st.studentId,
          taskIndex,
          nextStatus
        )
        //   .catch(error => {
        //   console.error('Ошибка сохранения статуса задания:', error);
        // });

        return { ...st, tasks: newTasks };
      })
    );
  }, [currentLesson, studentTasks]);

  // Применение нового количества заданий
  const applyTaskCount = () => {
    const newCount = Math.max(1, Math.min(20, tempTaskCount));
    setTaskCount(newCount);

    // Обновляем массивы заданий для всех студентов
    setStudentTasks(prev =>
      prev.map(st => {
        const newTasks = [...st.tasks];

        if (newCount > newTasks.length) {
          // Добавляем новые пустые задания
          newTasks.push(...new Array(newCount - newTasks.length).fill(0));
        } else {
          // Обрезаем до нового размера
          newTasks.splice(newCount);
        }

        return { ...st, tasks: newTasks as TaskStatus[] };
      })
    );

    setShowSettings(false);
  };

  // Получение иконки и цвета для статуса
  const getTaskIcon = (status: TaskStatus) => {
    switch (status) {
      case 0:
        return <Circle size={20} className="text-gray-300" />;
      case 1:
        return <CheckCircle2 size={20} className="text-green-500" />;
      case 2:
        return <XCircle size={20} className="text-red-500" />;
      case 3:
        return <CheckCircle2 size={20} className="text-yellow-500" />;
      default:
        return <Circle size={20} className="text-gray-300" />;
    }
  };

  // Статистика по студенту
  const getStudentStats = (tasks: TaskStatus[]) => {
    const correct = tasks.filter(t => t === 1).length;
    const incorrect = tasks.filter(t => t === 2).length;
    const partial = tasks.filter(t => t === 3).length;
    const empty = tasks.filter(t => t === 0).length;

    return { correct, incorrect, partial, empty };
  };

  // Общая статистика
  const totalStats = useMemo(() => {
    const stats = { correct: 0, incorrect: 0, partial: 0, empty: 0 };

    studentTasks.forEach(st => {
      const studentStats = getStudentStats(st.tasks);
      stats.correct += studentStats.correct;
      stats.incorrect += studentStats.incorrect;
      stats.partial += studentStats.partial;
      stats.empty += studentStats.empty;
    });

    return stats;
  }, [studentTasks]);

  if (!currentLesson || !groupData) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <CheckCircle2 size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Выберите группу для оценивания заданий</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      {/* Заголовок и настройки */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Оценивание заданий</h2>
          <p className="text-sm text-gray-500 mt-1">
            {selectedGroup.groupName} • {taskCount} {taskCount === 1 ? 'задание' : taskCount < 5 ? 'задания' : 'заданий'}
          </p>
        </div>

        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          <Settings size={18} />
          Настройки
        </button>
      </div>

      {/* Панель настроек */}
      {showSettings && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">
              Количество заданий:
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={tempTaskCount}
              onChange={(e) => setTempTaskCount(parseInt(e.target.value) || 1)}
              className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              onClick={applyTaskCount}
              className="px-4 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Применить
            </button>
            <button
              onClick={() => {
                setShowSettings(false);
                setTempTaskCount(taskCount);
              }}
              className="px-4 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Отмена
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-2">
            Максимум 20 заданий. При изменении количества данные будут обрезаны или дополнены пустыми ячейками.
          </p>
        </div>
      )}

      {/* Общая статистика */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={18} className="text-green-600" />
            <span className="text-sm font-medium text-green-700">Правильно</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{totalStats.correct}</div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-200">
          <div className="flex items-center gap-2 mb-1">
            <XCircle size={18} className="text-red-600" />
            <span className="text-sm font-medium text-red-700">Неправильно</span>
          </div>
          <div className="text-2xl font-bold text-red-700">{totalStats.incorrect}</div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <div className="flex items-center gap-2 mb-1">
            <Minus size={18} className="text-yellow-600" />
            <span className="text-sm font-medium text-yellow-700">Частично</span>
          </div>
          <div className="text-2xl font-bold text-yellow-700">{totalStats.partial}</div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <Circle size={18} className="text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Не выполнено</span>
          </div>
          <div className="text-2xl font-bold text-gray-700">{totalStats.empty}</div>
        </div>
      </div>

      {/* Таблица студентов и заданий */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                Ученик
              </th>
              {Array.from({ length: taskCount }, (_, i) => (
                <th key={i} className="px-2 py-3 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-medium text-gray-600">{i + 1}</span>
                    <button
                      onClick={() => setAllTasksStatus(i)}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      title="Изменить для всех"
                    >
                      ⚡
                    </button>
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                Статистика
              </th>
            </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {groupData.students.map((student) => {
              const tasks = studentTasks.find(st => st.studentId === student.id)?.tasks || [];
              const stats = getStudentStats(tasks);

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800 sticky left-0 bg-white">
                    {student.name}
                  </td>
                  {tasks.map((status, taskIndex) => (
                    <td key={taskIndex} className="px-2 py-3">
                      <button
                        onClick={() => toggleTaskStatus(student.id, taskIndex)}
                        className="w-full flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        {getTaskIcon(status)}
                      </button>
                    </td>
                  ))}
                  <td className="px-4 py-3 text-xs text-gray-600">
                    <div className="flex gap-3 justify-center">
                      <span className="text-green-600">✓{stats.correct}</span>
                      <span className="text-red-600">✗{stats.incorrect}</span>
                      <span className="text-yellow-600">½{stats.partial}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Легенда */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Обозначения:</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Circle size={18} className="text-gray-300" />
            <span className="text-sm text-gray-600">Не выполнено</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-green-500" />
            <span className="text-sm text-gray-600">Правильно</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle size={18} className="text-red-500" />
            <span className="text-sm text-gray-600">Неправильно</span>
          </div>
          <div className="flex items-center gap-2">
            <Minus size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-600">Частично правильно</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Нажимайте на иконки для переключения состояния задания
        </p>
      </div>

      <div className="min-h-20"></div>
    </div>
  );
};

export default TasksTab;