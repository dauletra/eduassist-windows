import React, { useEffect } from 'react';
import { Mic, MicOff, WifiOff, HelpCircle, MessageCircle, Play, MessageSquare, Loader2 } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

export const VoiceAssistant: React.FC = () => {
  const ASSISTANT_NAME = 'Galaxy';
  const WAKE_WORD = 'Galaxy';

  const {
    state,
    isActive,
    isMicAvailable,
    error,
    lastCommand,
    start,
    stop
  } = useVoiceAssistant();

  // Автостарт при монтировании
  useEffect(() => {
    start();
    return () => {
      stop();
    };
  }, []);

  // TODO: Убрать после тестирования
  const isInternetConnected = true;
  const assistantQuestion = '';
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

    if (state === 'waiting-wakeword') {
      return {
        text: `Скажите "${WAKE_WORD}"`,
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
    if (state === 'waiting-wakeword') return `💡 Скажите "${WAKE_WORD}" для активации голосовых команд`;
    if (state === 'wakeword-detected') return '✅ Wake word обнаружено!';
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
            <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 cursor-pointer ${stateConfig.bgStyle}`}>
              {stateConfig.icon}
            </div>

            {stateConfig.animation === 'recording' && (
              <>
                <div className="absolute inset-0 w-24 h-24 rounded-full bg-red-500 opacity-20 animate-ping" />
                <div className="absolute -top-1 -left-1 w-26 h-26 rounded-full border-2 border-red-300 opacity-60 animate-pulse" />
              </>
            )}

            {(stateConfig.animation === 'waiting-keyword' || stateConfig.animation === 'ready') && (
              <div className={`absolute -top-1 -left-1 w-26 h-26 rounded-full border-2 opacity-40 animate-pulse ${
                stateConfig.animation === 'waiting-keyword' ? 'border-purple-300' : 'border-green-300 opacity-60'
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

          {isActive && lastCommand && !assistantQuestion && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <MessageCircle size={18} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-800 mb-1">Выполнена команда:</p>
                  <p className="text-blue-700">"{lastCommand}"</p>
                </div>
              </div>
            </div>
          )}

          {isActive && !assistantQuestion && (
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