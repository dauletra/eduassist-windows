import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
// import reactLogo from './assets/react.svg'
// import { MessageSquare } from 'lucide-react';
import type { SelectedGroup, Lesson, Class } from './types';
import './App.css';
import TabBar from './components/TabBar';
import VoiceAssistant from './components/VoiceAssistant';
import Sidebar from './components/Sidebar';

const EduAssist = () => {
  // Основные состояния
  const [appData, setAppData] = useState<Class[] | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<{classId: string; groupId: string} | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleGroupSelectRef = useRef<(groupId: string) => void>(null);

  const selectedGroup = useMemo((): SelectedGroup | null => {
    if (!selectedGroupIds || !appData) return null;

    const cls = appData.find(c => c.id === selectedGroupIds.classId);
    if (!cls) return null;

    const group = cls?.groups.find(g => g.id === selectedGroupIds.groupId);
    if (!group) return null;

    return cls && group ? {
      classId: cls.id,
      className: cls.name,
      groupId: group.id,
      groupName: group.name,
    } : null;
  }, [selectedGroupIds, appData])

  const groupData = useMemo(() => {
    if (!selectedGroupIds || !appData) return null;

    const cls = appData.find(c => c.id === selectedGroupIds.classId);
    const group = cls?.groups.find(g => g.id === selectedGroupIds.groupId);

    return group || null;
  }, [selectedGroupIds, appData]);

  const loading = appData === null;

  const getStudentName = useCallback((studentId: string): string => {
    if (!appData || !selectedGroupIds) return studentId;

    const cls = appData.find(c => c.id === selectedGroupIds.classId);
    const group = cls?.groups.find(g => g.id === selectedGroupIds.groupId);
    const student = group?.students.find(s => s.id === studentId);

    return student?.name || studentId;  // s001 -> "Акмарал А."
  }, [appData, selectedGroupIds])

  const loadCurrentLesson = useCallback(async () => {
    if (!selectedGroupIds) {
      setCurrentLesson(null);
      setAllLessons([]);
      return;
    }

    try {
      setError(null);

      const lessons = await window.electronAPI.getAllLessons(selectedGroupIds.classId, selectedGroupIds.groupId);
      setAllLessons(lessons);

      let lesson = await window.electronAPI.getTodayLesson(selectedGroupIds.classId, selectedGroupIds.groupId);
      if (!lesson) {
        lesson = await window.electronAPI.createLesson(selectedGroupIds.classId, selectedGroupIds.groupId, 'Урок физики. Тема');
        setAllLessons(prev => [...prev, lesson]);
      }
      setCurrentLesson(lesson);
    } catch (error) {
      console.error("Ошибка загрузки урока: ", error);
      setError('Не удалось загрузить урок. Попробуйте еще раз.');
      setCurrentLesson(null);
      setAllLessons([]);
    }
  }, [selectedGroupIds])

  // Оптимистичное обновление оценки
  const handleUpdateGrade = useCallback(async (lessonId: string, studentId: string, grade: number | null) => {
    if (!currentLesson || currentLesson.id !== lessonId) return;

    const previousLesson = currentLesson;

    // Немедленно обновляем UI
    setCurrentLesson(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        students: prev.students.map(student =>
          student.id === studentId
            ? { ...student, grade }
            : student
        )
      };
    });

    // Отправляем изменения на сервер
    try {
      await window.electronAPI.updateGrade(lessonId, studentId, grade);
    } catch (error) {
      console.error('Ошибка обновления оценки:', error);
      setError('Не удалось сохранить оценку');
      setCurrentLesson(previousLesson);
    }
  }, [currentLesson]);

  // Оптимистичное обновление посещаемости
  const handleUpdateAttendance = useCallback(async (lessonId: string, studentId: string, attendance: boolean) => {
    if (!currentLesson || currentLesson.id !== lessonId) return;

    const previousLesson = currentLesson;

    // Немедленно обновляем UI
    setCurrentLesson(prev => {
      if (!prev) return prev;

      return {
        ...prev,
        students: prev.students.map(student =>
          student.id === studentId
            ? { ...student, attendance }
            : student
        )
      };
    });

    // Отправляем изменения на сервер
    try {
      await window.electronAPI.updateAttendance(lessonId, studentId, attendance);
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error);
      setError('Не удалось сохранить посещаемость')
      setCurrentLesson(previousLesson);
    }
  }, [currentLesson]);


  // Загружаем урок при изменении выбранной группы
  useEffect(() => {
    loadCurrentLesson();
  }, [loadCurrentLesson]);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadClassData();

    // Слушаем обновления из окна настроек
    const handleSettingsUpdate = () => {
      console.log('📩 Получено уведомление об обновлении настроек');
      loadClassData();
    }

    window.electronAPI.onSettingsUpdated(handleSettingsUpdate);

    return () => {
      window.electronAPI.removeSettingsUpdatedListener()
    }
  }, []);

  // Загрузка данных класса
  const loadClassData = async () => {
    try {
      setError(null)
      const students: Class[] = await window.electronAPI.loadStudentsList();
      setAppData(students);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Не удалось загрузить данный классов. Проверьте настройки.');
      setAppData([])
    }
  };

  // Обработчик выбора группы
  const handleGroupSelect =  useCallback(async (groupId: string) => {
    console.group('🎯 handleGroupSelect called');
    console.log('Requested groupId:', groupId);
    console.log('Current appData:', appData);

    if (!appData) {
      console.warn('⚠️ appData is null');
      console.groupEnd();
      return;
    }

    const cls = appData.find(c => c.groups.some(g => g.id === groupId));
    console.log('Found class:', cls);

    if (!cls) {
      console.warn('⚠️ Class not found for groupId:', groupId);
      console.groupEnd();
      return;
    }

    const group = cls.groups.find(g => g.id === groupId);
    console.log('Found group:', group);

    if (!group) {
      console.warn('⚠️ Group not found');
      console.groupEnd();
      return;
    }

    console.log('✅ Setting selectedGroupIds:', {
      classId: cls.id,
      groupId: group.id,
    });

    setSelectedGroupIds({
      classId: cls.id,
      groupId: group.id,
    });

    console.groupEnd();
  }, [appData]);

  useEffect(() => {
    handleGroupSelectRef.current = handleGroupSelect;
  }, [handleGroupSelect]);

  const handleGroupSelectStable = useCallback((groupId: string) => {
    handleGroupSelectRef.current?.(groupId);
  }, []);

  const handleLessonChange = (lesson: Lesson) => {
    setCurrentLesson(lesson);
  }

  // Обработчик возврата к выбору групп
  const handleBackToGroups = () => {
    setSelectedGroupIds(null);
    setCurrentLesson(null);
  };

  // Обработчик обновления настроек
  const handleSettingsUpdate = () => {
    loadClassData();
  };

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">

      {/*Добавить уведомление об ошибке*/}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 z-50 max-w-md">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <button
                onClick={() => setError(null)}
                className="text-sm underline mt-1 hover:text-red-800">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-80 bg-white border-r flex flex-col min-h-0">
        <Sidebar
          appData={appData}
          loading={loading}
          selectedGroup={selectedGroup}
          currentLesson={currentLesson}
          allLessons={allLessons}
          getStudentName={getStudentName}
          onGroupSelect={handleGroupSelect}
          onBackToGroups={handleBackToGroups}
          onLessonChange={handleLessonChange}
          onUpdateGrade={handleUpdateGrade}
          onUpdateAttendance={handleUpdateAttendance}
          onSettingsUpdate={handleSettingsUpdate}
        />
      </div>

      <div id="contentBar" className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Голосовой ассистент - фиксированный */}
        <div className="bg-white flex-shrink-0">
          <VoiceAssistant
            selectedGroup={selectedGroup}
            students={groupData?.students || []}
            onOpenJournal={handleGroupSelectStable}
            appData={appData}
          />
        </div>

        {/* Табы */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabBar
            selectedGroup={selectedGroup}
            currentLesson={currentLesson}
            groupData={groupData}
            className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default EduAssist;