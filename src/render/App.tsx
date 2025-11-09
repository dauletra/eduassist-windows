import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { SelectedGroup, Lesson, Class, EnrichedLesson } from './types';
import './App.css';
import TabBar from './components/TabBar';
import VoiceAssistant from './components/VoiceAssistant';
import Sidebar from './components/Sidebar';
import { CommandProvider } from './contexts/CommandContext';
import { DialogManager} from "./services/dialog/DialogManager.ts";
import { useCommandExecutor, useCommandContext } from "./contexts/CommandContext";
import { voiceCommandBus } from "./services/VoiceCommandBus.ts";
import { commandHandler, allCommands } from './services/commands';

const EduAssist = () => {
  // Основные состояния
  const [appData, setAppData] = useState<Class[] | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<{classId: string; groupId: string} | null>(null);
  const [currentLesson, setCurrentLesson] = useState<EnrichedLesson | null>(null);
  const [allLessons, setAllLessons] = useState<EnrichedLesson[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Единый источник для текущей группы
  const currentGroup = useMemo(() => {
    if (!selectedGroupIds || !appData) return null;
    const cls = appData.find(c => c.id === selectedGroupIds.classId);
    return cls?.groups.find(g => g.id === selectedGroupIds.groupId) || null;
  }, [selectedGroupIds, appData]);

  const selectedGroup = useMemo((): SelectedGroup | null => {
    if (!selectedGroupIds || !appData || !currentGroup) return null;

    const cls = appData.find(c => c.id === selectedGroupIds.classId);
    if (!cls) return null;

    return {
      classId: cls.id,
      className: cls.name,
      groupId: currentGroup.id,
      groupName: currentGroup.name,
    };
  }, [selectedGroupIds, appData, currentGroup]);

  // Инициализация команд
  useEffect(() => {
    console.log('🚀 Initializing Command System...');
    commandHandler.registerMany(allCommands);
    console.log('✅ Command System initialized');
    console.log('Registered commands:', commandHandler.getAllDefinitions().map(c => c.type));
  }, []);

  // Загрузка данных класса
  const loadClassData = useCallback(async () => {
    try {
      setError(null);
      const students: Class[] = await window.electronAPI.loadStudentsList();
      setAppData(students);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      setError('Не удалось загрузить данные классов. Проверьте настройки.');
      setAppData([]);
    }
  }, []);

  // Обогащает урок данными из appData
  const enrichLesson = useCallback((lesson: Lesson | null): EnrichedLesson | null => {
    if (!lesson || !currentGroup) return lesson as EnrichedLesson | null;

    console.log('📚 Enriching lesson with student names...');

    const enrichedStudents = lesson.students.map(lessonStudent => {
      const student = currentGroup.students.find(s => s.id === lessonStudent.id);

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
  }, [currentGroup]);

  // Загрузка текущего урока
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

      const enrichedLessons = lessons
        .map((l: Lesson | null) => enrichLesson(l))
        .filter(Boolean) as EnrichedLesson[];
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

      const enrichedLesson = enrichLesson(lesson);
      setCurrentLesson(enrichedLesson);

    } catch (error) {
      console.error("Ошибка загрузки урока: ", error);
      setError('Не удалось загрузить урок. Попробуйте еще раз.');
      setCurrentLesson(null);
      setAllLessons([]);
    }
  }, [selectedGroupIds, enrichLesson]);

  // Оптимистичное обновление оценки
  const handleUpdateGrade = useCallback(async (lessonId: string, studentId: string, grade: number | null) => {
    if (!currentLesson || currentLesson.id !== lessonId) return;

    const previousLesson = currentLesson;

    setCurrentLesson(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map(student =>
          student.id === studentId ? { ...student, grade } : student
        )
      };
    });

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

    setCurrentLesson(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map(student =>
          student.id === studentId ? { ...student, attendance } : student
        )
      };
    });

    try {
      await window.electronAPI.updateAttendance(lessonId, studentId, attendance);
    } catch (error) {
      console.error('Ошибка обновления посещаемости:', error);
      setError('Не удалось сохранить посещаемость');
      setCurrentLesson(previousLesson);
    }
  }, [currentLesson]);

  // Получить имя ученика
  const getStudentName = useCallback((studentId: string): string => {
    if (!currentGroup) return studentId;
    const student = currentGroup.students.find(s => s.id === studentId);
    return student?.name || studentId;
  }, [currentGroup]);

  // Обработчик выбора группы
  const handleGroupSelect = useCallback(async (groupId: string) => {
    console.group('🎯 handleGroupSelect called');
    console.log('Requested groupId:', groupId);

    if (!appData) {
      console.warn('⚠️ appData is null');
      console.groupEnd();
      return;
    }

    const cls = appData.find(c => c.groups.some(g => g.id === groupId));

    if (!cls) {
      console.warn('⚠️ Class not found for groupId:', groupId);
      console.groupEnd();
      return;
    }

    const group = cls.groups.find(g => g.id === groupId);

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

  // Обработчик возврата к выбору групп
  const handleBackToGroups = useCallback(() => {
    setSelectedGroupIds(null);
    setCurrentLesson(null);
  }, []);

  // Загружаем урок при изменении выбранной группы
  useEffect(() => {
    loadCurrentLesson();
  }, [loadCurrentLesson]);

  // Загрузка данных при монтировании
  useEffect(() => {
    loadClassData();

    const handleSettingsUpdate = () => {
      loadClassData();
    };

    window.electronAPI.onSettingsUpdated(handleSettingsUpdate);

    return () => {
      window.electronAPI.removeSettingsUpdatedListener();
    };
  }, [loadClassData]);

  const loading = appData === null;

  return (
    <CommandProvider
      currentLesson={currentLesson}
      selectedGroup={selectedGroup}
      setCurrentLesson={setCurrentLesson}
    >
      <EduAssistInner
        appData={appData}
        loading={loading}
        currentLesson={currentLesson}
        allLessons={allLessons}
        selectedGroup={selectedGroup}
        groupData={currentGroup}
        error={error}
        setError={setError}
        onGroupSelect={handleGroupSelect}
        onBackToGroups={handleBackToGroups}
        onLessonChange={setCurrentLesson}
        onUpdateGrade={handleUpdateGrade}
        onUpdateAttendance={handleUpdateAttendance}
        onSettingsUpdate={loadClassData}
        getStudentName={getStudentName}
      />
    </CommandProvider>
  );
};

const EduAssistInner = ({
                          appData,
                          loading,
                          currentLesson,
                          allLessons,
                          selectedGroup,
                          groupData,
                          error,
                          setError,
                          onGroupSelect,
                          onBackToGroups,
                          onLessonChange,
                          onUpdateGrade,
                          onUpdateAttendance,
                          onSettingsUpdate,
                          getStudentName
                        }) => {
  const commandExecutor = useCommandExecutor();
  const commandContext = useCommandContext();
  const dialogManagerRef = useRef<DialogManager | null>(null);

  // Инициализация DialogManager
  useEffect(() => {
    if (commandExecutor && !dialogManagerRef.current) {
      dialogManagerRef.current = new DialogManager(commandExecutor);
      console.log('✅ DialogManager initialized');
    }
  }, [commandExecutor]);

  // Подписка на голосовые команды через шину
  useEffect(() => {
    const handleVoiceCommand = (command: {
      text: string;
      intent: string;
      entities: any[];
      cluResponse: any;
    }) => {
      if (!dialogManagerRef.current) {
        console.error('❌ DialogManager not initialized');
        return;
      }

      console.log('🎤 Voice command received from bus:', command);

      dialogManagerRef.current
        .process(command.cluResponse, command.text, commandContext)
        .then(result => {
          console.log('🎯 DialogManager result:', result);
        })
        .catch(error => {
          console.error('❌ Dialog processing error:', error);
        });
    };

    // Подписываемся на событие
    voiceCommandBus.subscribe('command-recognized', handleVoiceCommand);

    // Отписываемся при размонтировании
    return () => {
      voiceCommandBus.unsubscribe('command-recognized', handleVoiceCommand);
    };
  }, [commandContext]);

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Уведомление об ошибке */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 z-50 max-w-md rounded-lg shadow-lg">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="font-medium mb-1">Ошибка</p>
              <p className="text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-sm underline mt-1 hover:text-red-800"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-80 bg-white border-r flex flex-col min-h-0">
        <Sidebar
          appData={appData}
          loading={loading}
          selectedGroup={selectedGroup}
          currentLesson={currentLesson}
          allLessons={allLessons}
          getStudentName={getStudentName}
          onGroupSelect={onGroupSelect}
          onBackToGroups={onBackToGroups}
          onLessonChange={onLessonChange}
          onUpdateGrade={onUpdateGrade}
          onUpdateAttendance={onUpdateAttendance}
          onSettingsUpdate={onSettingsUpdate}
        />
      </div>

      {/* Content Area */}
      <div id="contentBar" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Голосовой ассистент */}
        <div className="bg-white flex-shrink-0">
          <VoiceAssistant />
        </div>

        {/* Табы */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <TabBar
            selectedGroup={selectedGroup}
            currentLesson={currentLesson}
            groupData={groupData}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
};

export default EduAssist;