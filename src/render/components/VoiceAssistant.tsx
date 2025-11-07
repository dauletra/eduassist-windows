import React, { useEffect } from 'react';
import { Mic, MicOff, WifiOff, HelpCircle, MessageCircle, Play,
          MessageSquare, Loader2 } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import type { Lesson } from "../types";

interface VoiceAssistantProps {
  currentLesson: Lesson | null;
  onOpenJournal: (classNumber: string, classLetter: string, groupNumber: string) => boolean;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ currentLesson, onOpenJournal }) => {
  const ASSISTANT_NAME = 'AI-Maral';

  const {
    state,
    isActive,
    isMicAvailable,
    error,
    lastCommand,
    partialTranscript,
    assistantQuestion,
    assistantMessage,
    start,
    stop,
    startManualRecording,
    stopManualRecording
  } = useVoiceAssistant({ currentLesson, onOpenJournal });

  // Автостарт при монтировании
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, [start, stop]);


  // TODO: Убрать после тестирования
  const isInternetConnected = true;
  const hasDialogHistory = false;

  const getStateConfig = () => {
    if (!isActive) {
      return {
        text: 'Выключен',
        color: 'text-gray-500',
        bgStyle: 'bg-gray-400 opacity-50',
        icon: <MicOff size={32} className="text-white opacity-80" />,
        animation: null
      };
    }

    if (state === 'initializing') {
      return {
        text: 'Инициализация...',
        color: 'text-blue-600',
        bgStyle: 'bg-gradient-to-br from-blue-400 to-blue-600',
        icon: <Loader2 size={32} className="text-white animate-spin" />,
        animation: null
      };
    }

    if (state === 'error') {
      return {
        text: 'Ошибка',
        color: 'text-red-600',
        bgStyle: 'bg-gradient-to-br from-red-400 to-red-600',
        icon: <MicOff size={32} className="text-white" />,
        animation: null
      };
    }

    if (state === 'recording-command') {
      return {
        text: 'Записываю команду...',
        color: 'text-red-600',
        bgStyle: 'bg-gradient-to-br from-red-400 to-red-600 scale-110',
        icon: <Mic size={32} className="text-white animate-pulse" />,
        animation: 'recording'
      };
    }

    if (state === 'wakeword-detected') {
      return {
        text: 'Слушаю!',
        color: 'text-green-600',
        bgStyle: 'bg-gradient-to-br from-green-400 to-green-600 scale-105',
        icon: <Play size={32} className="text-white" />,
        animation: 'ready'
      };
    }

    if (state === 'processing') {
      return {
        text: 'Обрабатываю...',
        color: 'text-blue-600',
        bgStyle: 'bg-gradient-to-br from-blue-400 to-blue-600',
        icon: <Loader2 size={32} className="text-white animate-spin" />,
        animation: null
      };
    }

    if (state === 'awaiting-response') {
      return {
        text: 'Жду ответа...',
        color: 'text-amber-600',
        bgStyle: 'bg-gradient-to-br from-amber-400 to-amber-600',
        icon: <HelpCircle size={32} className="text-white animate-pulse" />,
        animation: 'awaiting'
      };
    }

    if (state === 'waiting-wakeword') {
      return {
        text: 'Скажите "Ай-Марал"',
        color: 'text-purple-600',
        bgStyle: 'bg-gradient-to-br from-purple-400 via-purple-600 to-blue-600',
        icon: <Mic size={32} className="text-white" />,
        animation: 'waiting-keyword'
      };
    }

    return {
      text: 'Готов к команде',
      color: 'text-green-600',
      bgStyle: 'bg-gradient-to-br from-green-400 to-green-600',
      icon: <Play size={32} className="text-white" />,
      animation: 'ready'
    };
  };

  const getHintText = () => {
    if (!isMicAvailable) return '⚠️ Проверьте подключение микрофона';
    if (!isInternetConnected) return '⚠️ Требуется подключение к интернету';
    if (error) return `⚠️ ${error}`;
    if (state === 'initializing') return '⏳ Подключаемся к микрофону...';
    if (state === 'recording-command') return '🎤 Произносите команду четко и громко';
    if (state === 'waiting-wakeword') return '💡 Скажите "Ай-Марал" для активации голосовых команд';
    if (state === 'wakeword-detected') return '✅ Wake word обнаружено!';
    if (state === 'processing') return '⏳ Обрабатываю команду...';
    if (state === 'awaiting-response') return '💬 Ожидаю ваш ответ на вопрос';
    return '💡 Можете произнести команду прямо сейчас';
  };

  const handleOpenDialogHistory = () => {
    console.log('Открываем историю диалогов с ассистентом');
  };

  const stateConfig = getStateConfig();
  const hasSystemIssues = !isMicAvailable || !isInternetConnected || !!error;

  return (
    <div className="flex items-center justify-center min-h-full p-8 relative">
      {hasDialogHistory && (
        <button
          onClick={handleOpenDialogHistory}
          className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200 opacity-60 hover:opacity-100 z-20"
          title="История диалогов"
          aria-label="Открыть историю диалогов"
        >
          <MessageSquare size={16} className="transition-colors duration-200" />
        </button>
      )}

      <div className="flex items-start gap-8 max-w-4xl w-full">
        <div className="flex-shrink-0 text-center">
          <div className="relative mb-3">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${stateConfig.bgStyle}`}
              onClick={() => {
                console.log('🖱️ Circle clicked, state:', state, 'isActive:', isActive);

                if (!isActive) {
                  console.log('⚠️ Assistant is not active');
                  return;
                }

                if (state === 'recording-command') {
                  console.log('⏹️ Stopping recording...');
                  stopManualRecording();
                } else if (state === 'waiting-wakeword' || state === 'awaiting-response') {
                  console.log('🎤 Starting recording...');
                  startManualRecording();
                } else {
                  console.log('⚠️ Cannot record in state:', state);
                }
              }}
              title={
                !isActive ? 'Ассистент выключен' :
                  state === 'recording-command' ? 'Нажмите чтобы остановить запись' :
                    state === 'waiting-wakeword' || state === 'awaiting-response' ? 'Нажмите чтобы начать запись' :
                      'Голосовой ассистент'
              }
            >
              {stateConfig.icon}
            </div>

            {stateConfig.animation === 'recording' && (
              <>
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-500 opacity-20 animate-ping pointer-events-none" />
                <div className="absolute -top-1 -left-1 w-26 h-26 rounded-full border-2 border-red-300 opacity-60 animate-pulse pointer-events-none" />
              </>
            )}

            {(stateConfig.animation === 'waiting-keyword' || stateConfig.animation === 'ready' || stateConfig.animation === 'awaiting') && (
              <div className={`absolute -top-1 -left-1 w-26 h-26 rounded-full border-2 opacity-40 animate-pulse pointer-events-none ${
                stateConfig.animation === 'waiting-keyword' ? 'border-purple-300' :
                  stateConfig.animation === 'awaiting' ? 'border-amber-300' :
                    'border-green-300 opacity-60'
              }`} />
            )}
          </div>

          <p className={`text-sm font-medium ${stateConfig.color}`}>
            {stateConfig.text}
          </p>
        </div>

        <div className="flex-1 space-y-3">
          {!isActive && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600 mb-2">Голосовой ассистент отключен</p>
              <button
                onClick={start}
                className="text-sm text-purple-600 hover:text-purple-700 font-medium"
              >
                Включить ассистента
              </button>
            </div>
          )}

          {isActive && hasSystemIssues && (
            <div className="flex gap-3">
              {!isMicAvailable && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <MicOff size={16} className="text-red-600" />
                  <span className="text-red-700">Микрофон недоступен</span>
                </div>
              )}

              {!isInternetConnected && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <WifiOff size={16} className="text-red-600" />
                  <span className="text-red-700">Нет интернета</span>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm">
                  <MicOff size={16} className="text-red-600" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}
            </div>
          )}

          {isActive && partialTranscript && state === 'recording-command' && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Mic size={18} className="text-purple-600 mt-0.5 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-800 mb-1">Распознаю:</p>
                  <p className="text-purple-700 italic">"{partialTranscript}"</p>
                </div>
              </div>
            </div>
          )}

          {isActive && assistantQuestion && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <HelpCircle size={18} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800 mb-1">{ASSISTANT_NAME} спрашивает:</p>
                  <p className="text-amber-700">"{assistantQuestion}"</p>
                </div>
              </div>
            </div>
          )}

          {isActive && lastCommand && !assistantQuestion && !partialTranscript && !assistantMessage && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Последняя команда:</p>
                  <p className="text-blue-700">"{lastCommand}"</p>
                </div>
              </div>
            </div>
          )}

          {isActive && assistantMessage && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800 mb-1">✅ Выполнено:</p>
                  <p className="text-green-700">{assistantMessage}</p>
                </div>
              </div>
            </div>
          )}

          {isActive && !assistantQuestion && !partialTranscript && !assistantMessage && (
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-sm text-gray-600">{getHintText()}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;