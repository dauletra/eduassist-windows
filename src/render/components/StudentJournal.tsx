// import {type Dispatch, type SetStateAction} from 'react';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal, MessageSquare, UserX } from 'lucide-react';
import type {SelectedGroup, Lesson } from '../types';

interface StudentJournalProps {
  selectedGroup: SelectedGroup;
  currentLesson: Lesson;
  allLessons: Lesson[];
  getStudentName: (studentId: string) => string;
  onBack: () => void;
  onLessonChange: (lesson: Lesson) => void;
  onUpdateGrade: (lessonId: string, studentId: string, grade: number | null) => Promise<void>;
  onUpdateAttendance: (lessonId: string, studentId: string, attendance: boolean) => Promise<void>;
}

const StudentJournal = ({ 
  selectedGroup, 
  currentLesson,
  allLessons,
  getStudentName,
  onBack,
  onLessonChange,
  onUpdateGrade,
  onUpdateAttendance,
}: StudentJournalProps) => {

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left?: number; right?: number } | null>(null);
  // const [localGrades, setLocalGrades] = useState<{[studentId: string]: string}>({});
  const menuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const currentLessonIndex = useMemo(() => {
    return allLessons.findIndex(l => l.id === currentLesson.id);
  }, [allLessons, currentLesson.id]);

  const canGoPrevious = currentLessonIndex > 0;
  const canGoNext = currentLessonIndex < allLessons.length - 1;

  // Форматируем дату урока
  const lessonDate = useMemo(() => {
    return new Date(currentLesson.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  }, [currentLesson.date])

  // Мемоизируем студентов с их текущими оценками
  const studentsWithGrades = useMemo(() => {
    return currentLesson.students.map(student => ({
      ...student,
      name: getStudentName(student.id),
      displayGrade: student.grade?.toString() || ''
    }));
  }, [currentLesson.students, getStudentName]);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenu !== null) {
        const menuElement = menuRefs.current[openMenu];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenMenu(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenu]);

  const handleMenuToggle = (studentId: string, event: React.MouseEvent) => {
    if (openMenu === studentId) {
      setOpenMenu(null);
      setMenuPosition(null);
      return;
    }

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const menuHeight = 220;
    const menuWidth = 192;

    const spaceBelow = windowHeight - rect.bottom;
    const shouldOpenUp = spaceBelow < menuHeight;

    const shouldOpenLeft = rect.right > windowWidth - menuWidth;

    setMenuPosition({
      top: shouldOpenUp ? rect.top - menuHeight - 4 : rect.bottom + 4,
      ...(shouldOpenLeft
          ? { right: windowWidth - rect.right }
          : { left: rect.left }
      )
    });

    setOpenMenu(studentId);
  };

  // Объединенная функция обновления оценки
  const handleGradeUpdate = useCallback(async (studentId: string, gradeValue: string) => {
    // Парсим значение для отправки на сервер (только цифры от 1 до 10)
    let grade: number | null = null;
    if (gradeValue) {
      const parsed = parseInt(gradeValue);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 10) {
        grade = parsed;
      }
    }

    try {
      await onUpdateGrade(currentLesson.id, studentId, grade);
    } catch (error) {
      console.error('Ошибка обновления оценки:', error);
    }
  }, [currentLesson.id, onUpdateGrade]);

  // Обработчики для меню
  const handleQuickScore = useCallback((studentId: string, score: string) => {
    handleGradeUpdate(studentId, score);
    setOpenMenu(null);
    setMenuPosition(null);
  }, [handleGradeUpdate]);

  const handleAttendanceUpdate = useCallback(async (studentId: string, attendance: boolean) => {
    try {
      await onUpdateAttendance(currentLesson.id, studentId, attendance);
      setOpenMenu(null);
      setMenuPosition(null);
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error);
    }
  }, [currentLesson.id, onUpdateAttendance]);

  const handleComment = useCallback((studentId: string) => {
    // TODO: Открыть модальное окно для добавления комментария
    console.log('Добавить комментарий для ученика:', studentId);
    setOpenMenu(null);
    setMenuPosition(null);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Заголовок с навигацией */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Назад к выбору групп"
          >
            <ChevronLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h3 className="font-medium text-gray-800">{selectedGroup.className}</h3>
            <p className="text-sm text-gray-500">{selectedGroup.groupName}</p>
          </div>
        </div>

        {/* Навигация по датам */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-gray-700">Ученики ({currentLesson.students.length})</h4>
          <div className="flex items-center gap-2">
            <button
              onClick={() =>{
                if (canGoPrevious) {
                  onLessonChange(allLessons[currentLessonIndex - 1]);
                }
              }}
              disabled={!canGoPrevious}
              className={`transition-colors ${
                canGoPrevious
                  ? 'text-gray-600 hover:text-gray-800'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Предыдущий день"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs text-gray-500 min-w-20 text-center">
              {lessonDate}
            </span>
            <button
              onClick={() => {
                if (canGoNext) {
                  onLessonChange(allLessons[currentLessonIndex + 1]);
                }
              }}
              disabled={!canGoNext}
              className={`transition-colors ${
                canGoNext
                  ? 'text-gray-600 hover:text-gray-800'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
              aria-label="Следующий день"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Список учеников */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-2">
            {studentsWithGrades.map((student, index) => {
              return (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-2 px-2 hover:bg-gray-50 rounded transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm text-gray-500 w-6 flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-sm text-gray-700 truncate">
                      {student.name}
                    </span>
                    {!student.attendance && (
                      <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded">
                        Нб
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="—"
                      className="w-12 h-7 text-center text-sm border border-gray-300 rounded focus:border-purple-500 focus:outline-none transition-colors"
                      value={student.displayGrade}
                      onChange={(e) => handleGradeUpdate(student.id, e.target.value)}
                      maxLength={2}
                      aria-label={`Оценка для ${student.name}`}
                    />

                    {/* Контейнер для кнопки и меню */}
                    <div className="relative">
                      <button
                        className="text-gray-400 hover:text-gray-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 hover:bg-gray-100 rounded"
                        aria-label="Дополнительные действия"
                        onClick={(e) => handleMenuToggle(student.id, e)}
                      >
                        <MoreHorizontal size={14}/>
                      </button>

                      {/* Выпадающее меню */}
                      {openMenu === student.id && menuPosition && (
                        <div
                          ref={(el) => {
                            menuRefs.current[student.id] = el
                          }}
                          className="fixed w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1 animate-in fade-in-0 zoom-in-95 duration-100"
                          style={{
                            top: menuPosition.top,
                            left: menuPosition.left,
                            right: menuPosition.right,
                          }}
                        >
                          {/* Быстрые оценки */}
                          <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b">
                            Быстрые оценки
                          </div>

                          <div className="grid grid-cols-5 gap-1 p-2">
                            {[6, 7, 8, 9, 10].map((score) => (
                              <button
                                key={score}
                                onClick={() => handleQuickScore(student.id, score.toString())}
                                className="w-8 h-8 text-sm bg-gray-50 hover:bg-purple-100 hover:text-purple-700 rounded transition-colors font-medium"
                              >
                                {score}
                              </button>
                            ))}
                          </div>

                          <div className="border-t">
                            <button
                              onClick={() => handleAttendanceUpdate(student.id, false)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <UserX size={14} className="text-orange-500"/>
                              Отсутствует
                            </button>

                            <button
                              onClick={() => handleAttendanceUpdate(student.id, true)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <UserX size={14} className="text-green-500" />
                              Отметить присутствие
                            </button>

                            <button
                              onClick={() => handleComment(student.id)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                            >
                              <MessageSquare size={14} className="text-blue-500"/>
                              Добавить комментарий
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )
            })}
          </div>

          {currentLesson.students.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет данных об учениках</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default StudentJournal;