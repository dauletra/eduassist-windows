// src/App.tsx
import { useEffect, useRef } from 'react';
// import type { SelectedGroup } from './types';
import './App.css';
import TabBar from './components/TabBar';
import VoiceAssistant from './components/VoiceAssistant';
import Sidebar from './components/Sidebar';
import { StoreProvider, useAppState, useAppStore, useCommandDispatcher, useDialogContext } from './contexts/StoreContext';
import { VoiceCommandProcessor } from "./services/dialog/VoiceCommandProcessor";
import { voiceCommandBus } from "./services/VoiceCommandBus.ts";

const EduAssist = () => {
  return (
    <StoreProvider>
      <EduAssistContent />
    </StoreProvider>
  );
};

const EduAssistContent = () => {
  // Используем единый StoreContext вместо множества контекстов
  const state = useAppState();
  const store = useAppStore();
  const commandDispatcher = useCommandDispatcher();
  const dialogContext = useDialogContext(); // Получаем DialogContext из Store

  const {
    classes,
    currentLesson,
    currentGroup,
    // currentClass,
    // loading,
    error,
    // groupLessons
  } = state;

  const voiceProcessorRef = useRef<VoiceCommandProcessor | null>(null);

  // Формируем selectedGroup для совместимости с существующими компонентами
  // const selectedGroup = useMemo((): SelectedGroup | null => {
  //   if (!currentClass || !currentGroup) return null;
  //
  //   return {
  //     classId: currentClass.id,
  //     className: currentClass.name,
  //     groupId: currentGroup.id,
  //     groupName: currentGroup.name,
  //   };
  // }, [currentClass, currentGroup]);

  // Инициализация VoiceCommandProcessor
  useEffect(() => {
    if (commandDispatcher && !voiceProcessorRef.current) {
      voiceProcessorRef.current = new VoiceCommandProcessor(commandDispatcher);
      console.log('✅ VoiceCommandProcessor initialized');
    }
  }, [commandDispatcher]);

  // Подписка на голосовые команды через шину
  useEffect(() => {
    const handleVoiceCommand = (command: {
      text: string;
      intent: string;
      entities: any[];
      cluResponse: any;
    }) => {
      if (!voiceProcessorRef.current) {
        console.error('❌ VoiceCommandProcessor not initialized');
        return;
      }

      console.log('🎤 Voice command received from bus:', command);

      // Используем DialogContext из StoreContext
      voiceProcessorRef.current
        .process(command.cluResponse, command.text, dialogContext)
        .then(result => {
          console.log('🎯 VoiceCommandProcessor result:', result);
        })
        .catch(error => {
          console.error('❌ Voice processing error:', error);
        });
    };

    voiceCommandBus.subscribe('command-recognized', handleVoiceCommand);

    return () => {
      voiceCommandBus.unsubscribe('command-recognized', handleVoiceCommand);
    };
  }, [dialogContext]); // Зависимость от dialogContext

  // Загрузка данных при монтировании
  useEffect(() => {
    const loadInitialData = async () => {
      await commandDispatcher.executeFromSystem('LoadData', {});
    };

    loadInitialData();

    // Слушаем обновления настроек
    const handleSettingsUpdate = () => {
      commandDispatcher.executeFromSystem('LoadData', {});
    };

    window.electronAPI.onSettingsUpdated(handleSettingsUpdate);

    return () => {
      window.electronAPI.removeSettingsUpdatedListener();
    };
  }, [commandDispatcher]);

  // Обработчик выбора группы
  const handleGroupSelect = async (groupId: string) => {
    console.log('➡️ Group selected:', groupId);

    const cls = classes.find(c => c.groups.some(g => g.id === groupId));
    const group = cls?.groups.find(g => g.id === groupId);

    if (!cls || !group) {
      console.log('❌ Group or class not found');
      return;
    }

    // Исправленные регулярные выражения
    const classNumber = cls.id.match(/\d+/)?.[0];
    const classLetter = cls.id.match(/[A-Za-zА-Яа-яӘә]/)?.[0]; // Добавлены строчные буквы
    const groupNumber = group.id.split('-')[1];

    console.log('Class ID:', cls.id);
    console.log('Group ID:', group.id);
    console.log('Parsed:', { classNumber, classLetter, groupNumber });

    if (!classNumber || !classLetter || !groupNumber) {
      console.log('❌ Failed to parse class/group data');
      return;
    }

    await commandDispatcher.executeFromUI('OpenJournal', {
      classNumber,
      classLetter,
      groupNumber
    });
  };

  // Обработчик возврата к выбору групп
  const handleBackToGroups = async () => {
    await commandDispatcher.executeFromUI('CloseJournal', {});
  };

  // Обработчик выбора урока
  const selectLesson = (lessonId: string) => {
    store.setState(prev => ({
      ...prev,
      currentLessonId: lessonId
    }));
  };

  // Обработчик обновления оценки
  const handleUpdateGrade = async (studentId: string, grade: number | null) => {
    if (!currentLesson) {
      console.warn('⚠️ No lesson selected');
      return;
    }

    await commandDispatcher.executeFromUI('SetGrade', {
      studentName: studentId,
      numberValue: grade
    });
  };

  // Обработчик обновления посещаемости
  const handleUpdateAttendance = async (studentId: string, attendance: boolean) => {
    if (!currentLesson) {
      console.warn('⚠️ No lesson selected');
      return;
    }

    await commandDispatcher.executeFromUI('UpdateAttendance', {
      studentId,
      attendance
    });
  };

  // // Обработчик случайного выбора ученика
  // const handleRandomStudent = async (onlyPresent: boolean = true) => {
  //   const result = await commandDispatcher.executeFromUI('RandomStudent', {
  //     onlyPresent
  //   });
  //
  //   if (result.success && result.data?.studentId) {
  //     console.log(`🎯 Highlight student: ${result.data.studentName}`);
  //   }
  // };
  //
  // // // Обработчик деления на группы по количеству
  // // const handleDivideByGroupCount = async (groupCount: number, onlyPresent: boolean = true) => {
  // //   const result = await commandDispatcher.executeFromUI('DivideByGroupCount', {
  // //     numberValue: groupCount,
  // //     onlyPresent
  // //   });
  // //
  // //   if (result.success && result.data) {
  // //     console.log('✅ Groups formed by count:', result.data.groups);
  // //   }
  // // };
  // //
  // // // Обработчик деления на группы по размеру
  // // const handleDivideByGroupSize = async (groupSize: number, onlyPresent: boolean = true) => {
  // //   const result = await commandDispatcher.executeFromUI('DivideByGroupSize', {
  // //     numberValue: groupSize,
  // //     onlyPresent
  // //   });
  // //
  // //   if (result.success && result.data) {
  // //     console.log('✅ Groups formed by size:', result.data.groups);
  // //   }
  // // };

  // Получить имя ученика
  const getStudentName = (studentId: string): string => {
    if (!currentGroup) return studentId;
    const student = currentGroup.students.find(s => s.id === studentId);
    return student?.name || studentId;
  };

  // Очистить ошибку
  const clearError = () => {
    store.setState(prev => ({ ...prev, error: null }));
  };

  // Перезагрузка данных
  const reloadData = async () => {
    await commandDispatcher.executeFromSystem('LoadData', {});
  };

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
                onClick={clearError}
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
          getStudentName={getStudentName}
          onGroupSelect={handleGroupSelect}
          onBackToGroups={handleBackToGroups}
          onLessonChange={selectLesson}
          onUpdateGrade={handleUpdateGrade}
          onUpdateAttendance={handleUpdateAttendance}
          onSettingsUpdate={reloadData}
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
          <TabBar className="h-full" />
        </div>
      </div>
    </div>
  );
};

export default EduAssist;