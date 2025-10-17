/**
 * Компонент для тестирования голосового управления
 * Показывает детальную информацию о состоянии системы
 */

import React, { useEffect, useState } from 'react';
import { Mic, MicOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

export const VoiceAssistantTest: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);

  const {
    state,
    isActive,
    isMicAvailable,
    error,
    start,
    stop
  } = useVoiceAssistant();

  // Перехват console.log для отображения в UI
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: string, ...args: any[]) => {
      const message = args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');

      setLogs(prev => [...prev.slice(-20), `[${type}] ${new Date().toLocaleTimeString()}: ${message}`]);
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  const getStateIcon = () => {
    switch (state) {
      case 'inactive':
        return <MicOff className="text-gray-500" />;
      case 'initializing':
        return <Loader2 className="text-blue-500 animate-spin" />;
      case 'waiting-wakeword':
        return <Mic className="text-purple-500 animate-pulse" />;
      case 'wakeword-detected':
        return <CheckCircle className="text-green-500" />;
      case 'recording-command':
        return <Mic className="text-red-500 animate-pulse" />;
      case 'error':
        return <XCircle className="text-red-500" />;
      default:
        return <Mic className="text-gray-500" />;
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Заголовок */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-2">Тестирование голосового ассистента</h1>
          <p className="text-gray-600">Отладочная панель для проверки работы wake-word detection</p>
        </div>

        {/* Состояние системы */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Состояние системы</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {getStateIcon()}
              <div>
                <p className="text-sm text-gray-600">Статус</p>
                <p className="font-medium">{state}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {isActive ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-gray-400" />
              )}
              <div>
                <p className="text-sm text-gray-600">Активность</p>
                <p className="font-medium">{isActive ? 'Активен' : 'Неактивен'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {isMicAvailable ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <XCircle className="text-red-500" />
              )}
              <div>
                <p className="text-sm text-gray-600">Микрофон</p>
                <p className="font-medium">{isMicAvailable ? 'Доступен' : 'Недоступен'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              {error ? (
                <XCircle className="text-red-500" />
              ) : (
                <CheckCircle className="text-green-500" />
              )}
              <div>
                <p className="text-sm text-gray-600">Ошибки</p>
                <p className="font-medium text-xs">{error || 'Нет'}</p>
              </div>
            </div>
          </div>

          {/* Управление */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={start}
              disabled={isActive}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Запустить
            </button>
            <button
              onClick={stop}
              disabled={!isActive}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Остановить
            </button>
            <button
              onClick={() => setLogs([])}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Очистить логи
            </button>
          </div>
        </div>

        {/* Инструкция */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">📋 Инструкция по тестированию</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
            <li>Нажмите "Запустить" - система начнет инициализацию</li>
            <li>Разрешите доступ к микрофону в браузере</li>
            <li>Дождитесь статуса "waiting-wakeword"</li>
            <li>Произнесите "Galaxy" громко и четко</li>
            <li>Проверьте, что статус изменился на "wakeword-detected"</li>
            <li>Наблюдайте за логами в консоли ниже</li>
          </ol>
        </div>

        {/* Логи */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Логи системы (последние 20)</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">Логи появятся здесь...</p>
            ) : (
              logs.map((log, idx) => (
                <div key={idx} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Информация о конфигурации */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">⚙️ Конфигурация</h2>
          <div className="text-sm space-y-2 text-gray-700">
            <p><strong>Wake word:</strong> Galaxy</p>
            <p><strong>Sample rate:</strong> 16000 Hz</p>
            <p><strong>Channels:</strong> 1 (mono)</p>
            <p><strong>Frame size:</strong> 512 samples (32 ms)</p>
            <p><strong>Wake word model:</strong> ./resources/Galaxy_en_windows_v3_0_0.ppn</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantTest;