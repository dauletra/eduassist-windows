import { useState, useEffect, useMemo, useCallback } from 'react';
// import reactLogo from './assets/react.svg'
// import { MessageSquare } from 'lucide-react';
import type { SelectedGroup, Lesson, Class, EnrichedLesson } from './types';
import './App.css';
import TabBar from './components/TabBar';
import VoiceAssistant from './components/VoiceAssistant';
import Sidebar from './components/Sidebar';

const EduAssist = () => {
  // Основные состояния
  const [appData, setAppData] = useState<Class[] | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<{classId: string; groupId: string} | null>(null);
  const [currentLesson, setCurrentLesson] = useState<EnrichedLesson | null>(null);
  const [allLessons, setAllLessons] = useState<EnrichedLesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Обогащает урок данными из appData
   * Добавляет имена учеников из Group.students к LessonStudent
   */
  const enrichLesson = useCallback((lesson: Lesson | null): EnrichedLesson | null => {
    if (!lesson || !appData) return lesson as EnrichedLesson | null;

    console.log('📚 Enriching lesson with student names...');

    // Найти класс и группу
    const cls = appData.find(c => c.id === lesson.classId);
    const group = cls?.groups.find(g => g.id === lesson.groupId);

    if (!group) {
      console.warn('⚠️ Group not found for lesson:', lesson.classId, lesson.groupId);
      return lesson as EnrichedLesson;
    }

    // Обогатить учеников именами
    const enrichedStudents = lesson.students.map(lessonStudent => {
      const student = group.students.find(s => s.id === lessonStudent.id);

      if (!student) {
        console.warn('⚠️ Student not found:', lessonStudent.id);
      }

      return {
        ...lessonStudent,
        name: student?.name || `Ученик ${lessonStudent.id}`
      };
    });

    console.log('✅ Lesson enriched:', {
      total: enrichedStudents.length,
      withNames: enrichedStudents.filter(s => !s.name.startsWith('Ученик ')).length
    });

    return {
      ...lesson,
      students: enrichedStudents
    };
  }, [appData]);

  // ИЗМЕНИТЬ loadCurrentLesson:
  const loadCurrentLesson = useCallback(async () => {
    if (!selectedGroupIds) {
      setCurrentLesson(null);
      setAllLessons([]);
      return;
    }

    try {
      setError(null);

      const lessons = await window.electronAPI.getAllLessons(
        selectedGroupIds.classId,
        selectedGroupIds.groupId
      );

      // Обогатить все уроки
      const enrichedLessons = lessons.map((l: Lesson | null) => enrichLesson(l)).filter(Boolean) as EnrichedLesson[];
      setAllLessons(enrichedLessons);

      let lesson = await window.electronAPI.getTodayLesson(
        selectedGroupIds.classId,
        selectedGroupIds.groupId
      );

      if (!lesson) {
        lesson = await window.electronAPI.createLesson(
          selectedGroupIds.classId,
          selectedGroupIds.groupId,
          'Урок физики. Тема'
        );
        const enriched = enrichLesson(lesson);
        if (enriched) {
          setAllLessons(prev => [...prev, enriched]);
        }
      }

      // Обогатить текущий урок
      const enrichedLesson = enrichLesson(lesson);
      setCurrentLesson(enrichedLesson);

    } catch (error) {
      console.error("Ошибка загрузки урока: ", error);
      setError('Не удалось загрузить урок. Попробуйте еще раз.');
      setCurrentLesson(null);
      setAllLessons([]);
    }
  }, [selectedGroupIds, enrichLesson]);

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

  /**
   * Обработчик открытия журнала по параметрам из голосовой команды
   * Вызывается из VoiceAssistant при команде "Открой журнал 9 В второй группы"
   *
   * @returns true если журнал найден и открыт, false если не найден
   */
  const handleOpenJournalByParams = useCallback((
    classNumber: string,
    classLetter: string,
    groupNumber: string
  ): boolean => {
    console.group('📖 Opening Journal by Voice Parameters');
    console.log('Parameters:', { classNumber, classLetter, groupNumber });

    if (!appData) {
      console.warn('⚠️ appData is null');
      console.groupEnd();
      return false;
    }

    // Поиск класса (гибкий - учитываем разные форматы: "9В", "9 В", "9 В класс")
    const className = `${classNumber}${classLetter}`;
    console.log('Looking for class:', className);

    const cls = appData.find(c => {
      // Нормализуем имя класса: убираем пробелы и слово "класс"
      const normalized = c.name
        .replace(/\s+/g, '')      // убрать все пробелы
        .replace(/класс/gi, '')   // убрать слово "класс"
        .toUpperCase();

      const searchName = className
        .replace(/\s+/g, '')
        .toUpperCase();

      return normalized === searchName;
    });

    if (!cls) {
      console.warn(`⚠️ Class ${className} not found`);
      console.log('Available classes:', appData.map(c => c.name));
      console.groupEnd();
      return false;
    }

    console.log('✅ Class found:', cls.name);

    // Поиск группы (извлекаем номер из названия)
    const group = cls.groups.find(g => {
      // Извлечь номер группы из названия (например, "1 группа" -> "1", "Группа 2" -> "2")
      const match = g.name.match(/(\d+)/);
      const groupNum = match ? match[1] : null;

      return groupNum === groupNumber;
    });

    if (!group) {
      console.warn(`⚠️ Group ${groupNumber} not found in class ${className}`);
      console.log('Available groups:', cls.groups.map(g => g.name));
      console.groupEnd();
      return false;
    }

    console.log(`✅ Opening journal: ${className} ${group.name} (groupId: ${group.id})`);
    console.groupEnd();

    // Открываем журнал через существующий обработчик
    setSelectedGroupIds({
      classId: cls.id,
      groupId: group.id,
    });

    return true;
  }, [appData]);

  const handleLessonChange = (lesson: EnrichedLesson) => {
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
            currentLesson={currentLesson}
            onOpenJournal={handleOpenJournalByParams}
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