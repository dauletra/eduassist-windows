import { useState, useEffect, useMemo, useCallback } from 'react';
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

  const selectedGroup = useMemo((): SelectedGroup | null => {
    if (!selectedGroupIds || !appData) return null;

    const cls = appData.find(c => c.id === selectedGroupIds.classId);
    const group = cls?.groups.find(g => g.id === selectedGroupIds.groupId);

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
      return;
    }

    try {
      let lesson = await window.electronAPI.getTodayLesson(selectedGroupIds.classId, selectedGroupIds.groupId);
      if (!lesson) {
        lesson = await window.electronAPI.createLesson(selectedGroupIds.classId, selectedGroupIds.groupId, 'Урок физики. Тема');
      }
      setCurrentLesson(lesson);
    } catch (error) {
      console.error("Ошибка загрузки урока: ", error);
      setCurrentLesson(null);
    }
  }, [selectedGroupIds])

  // Оптимистичное обновление оценки
  const handleUpdateGrade = useCallback(async (lessonId: string, studentId: string, grade: number | null) => {
    if (!currentLesson || currentLesson.id !== lessonId) return;

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
      // В случае ошибки возвращаем предыдущее состояние
      loadCurrentLesson();
    }
  }, [currentLesson, loadCurrentLesson]);

  // Оптимистичное обновление посещаемости
  const handleUpdateAttendance = useCallback(async (lessonId: string, studentId: string, attendance: boolean) => {
    if (!currentLesson || currentLesson.id !== lessonId) return;

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
      // В случае ошибки возвращаем предыдущее состояние
      loadCurrentLesson();
    }
  }, [currentLesson, loadCurrentLesson]);


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
      const students: Class[] = await window.electronAPI.loadStudentsList();
      setAppData(students);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setAppData([])
    }
  };

  // Обработчик выбора группы
  const handleGroupSelect = async (groupId: string) => {
    if (!appData) return;

    const cls = appData.find(c => c.groups.some(g => g.id === groupId));
    if (!cls) return;

    const group = cls.groups.find(g => g.id === groupId);
    if (!group) return;

    setSelectedGroupIds({
      classId: cls.id,
      groupId: group.id,
    });
  };

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
      <div className="w-80 bg-white border-r flex flex-col min-h-0">
        <Sidebar
          appData={appData}
          loading={loading}
          selectedGroup={selectedGroup}
          currentLesson={currentLesson}
          getStudentName={getStudentName}
          onGroupSelect={handleGroupSelect}
          onBackToGroups={handleBackToGroups}
          onUpdateGrade={handleUpdateGrade}
          onUpdateAttendance={handleUpdateAttendance}
          onSettingsUpdate={handleSettingsUpdate}
        />
      </div>

      <div id="contentBar" className="flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Голосовой ассистент - фиксированный */}
        <div className="bg-white flex-shrink-0">
          <VoiceAssistant />
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