// src/render/App.tsx
import { useEffect, useRef } from 'react';
// import type { SelectedGroup } from './types';
import './App.css';
import TabBar from './components/TabBar';
import VoiceAssistant from './components/VoiceAssistant';
import Sidebar from './components/Sidebar';
import { StoreProvider, useAppState, useAppStore, useCommandDispatcher } from './contexts/StoreContext';
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
  const state = useAppState();
  const store = useAppStore();
  const commandDispatcher = useCommandDispatcher();

  const {
    // currentLesson,
    currentGroup,
    error,
  } = state;

  const voiceProcessorRef = useRef<VoiceCommandProcessor | null>(null);

  // Инициализация VoiceCommandProcessor
  useEffect(() => {
    if (commandDispatcher && !voiceProcessorRef.current) {
      voiceProcessorRef.current = new VoiceCommandProcessor(commandDispatcher, store);
      console.log('✅ VoiceCommandProcessor initialized');
    }
  }, [commandDispatcher, store]);

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

      voiceProcessorRef.current
        .process(command.cluResponse, command.text)
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
  }, []);

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
          onGroupSelect={(groupId) => commandDispatcher.executeFromUI('OpenJournal', { groupId })}
          onBackToGroups={() => commandDispatcher.executeFromUI('CloseJournal', {})}
          onLessonChange={(lessonId) => commandDispatcher.executeFromUI('SelectLesson', { lessonId })}
          onUpdateGrade={(studentId, grade) => commandDispatcher.executeFromUI('SetGrade', { studentName: studentId, numberValue: grade })}
          onUpdateAttendance={(studentId, attendance) => commandDispatcher.executeFromUI('UpdateAttendance', { studentId, attendance })}
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