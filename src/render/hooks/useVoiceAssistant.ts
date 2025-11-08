import { useState, useEffect, useCallback, useRef } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';
import { audioService } from '../services/AudioService';
import { createWebSocketService } from '../services/WebSocketService';
import { createCLUService } from '../services/CLUService';
import { DialogManager } from '../services/dialog/DialogManager.ts';
import { VOICE_CONFIG } from '../config/voiceConfig';
import type { EnrichedLesson } from "../types";
import { voiceCommandBus } from '../services/CommandEventBus.ts';
import { useCommandContext } from '../contexts/CommandContext.tsx';

export type AssistantState =
  | 'inactive'
  | 'initializing'
  | 'waiting-wakeword'
  | 'wakeword-detected'
  | 'recording-command'
  | 'processing'
  | 'awaiting-response'
  | 'error';

interface VoiceAssistantState {
  state: AssistantState;
  isActive: boolean;
  isMicAvailable: boolean;
  error: string | null;
  lastCommand: string | null;
  partialTranscript: string | null;
  assistantQuestion: string | null;
  assistantMessage: string | null;
}

/**
 * Новый интерфейс параметров
 *
 * @param currentLesson - текущий урок со всеми данными (students, grades, attendance)
 * @param onOpenJournal - callback для открытия другого журнала (принимает classNumber, classLetter, groupNumber)
 */
interface UseVoiceAssistantParams {
  currentLesson: EnrichedLesson | null;
  onOpenJournal: (classNumber: string, classLetter: string, groupNumber: string) => boolean;
}

export const useVoiceAssistant = ({ currentLesson, onOpenJournal }: UseVoiceAssistantParams) => {
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>({
    state: 'inactive',
    isActive: false,
    isMicAvailable: false,
    error: null,
    lastCommand: null,
    partialTranscript: null,
    assistantQuestion: null,
    assistantMessage: null,
  });

  const commandContext = useCommandContext();

  const isInitializedRef = useRef(false);
  const currentLessonRef = useRef<EnrichedLesson | null>(null);

  const wsServiceRef = useRef(
    createWebSocketService({
      baseUrl: VOICE_CONFIG.api.baseUrl,
      apiKey: VOICE_CONFIG.api.apiKey,
      language: VOICE_CONFIG.api.language
    })
  );

  const cluServiceRef = useRef(
    createCLUService({
      baseUrl: VOICE_CONFIG.api.baseUrl,
      apiKey: VOICE_CONFIG.api.apiKey,
      locale: VOICE_CONFIG.api.language
    })
  );

  const dialogManagerRef = useRef<DialogManager | null>(null);

  // Обновляем ref при изменении currentLesson
  useEffect(() => {
    currentLessonRef.current = currentLesson;
  }, [currentLesson]);

  // Ленивая инициализация DialogManager
  const getDialogManager = useCallback(() => {
    if (!dialogManagerRef.current) {
      dialogManagerRef.current = new DialogManager();
      console.log('✅ DialogManager initialized');
    }
    return dialogManagerRef.current;
  }, []);

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    keywordDetection,
    isLoaded,
    isListening,
    error: porcupineError,
    init,
    start: startPorcupine,
    stop: stopPorcupine,
    release
  } = usePorcupine();

  // Обработка ошибок Porcupine
  useEffect(() => {
    if (porcupineError) {
      console.error('❌ Porcupine error:', porcupineError);
      setAssistantState(prev => ({
        ...prev,
        state: 'error',
        error: porcupineError.toString()
      }));
    }
  }, [porcupineError]);

  // Автостарт при загрузке
  useEffect(() => {
    if (isLoaded && !isInitializedRef.current) {
      console.log('👂 Starting wake word detection...');
      startPorcupine();
      isInitializedRef.current = true;
    }
  }, [isLoaded, startPorcupine]);


  // Начать захват аудио
  const startAudioCapture = useCallback(() => {
    audioService.startCapture((audioData) => {
      // Отправлять аудио фреймы на сервер
      if (wsServiceRef.current.isConnected()) {
        wsServiceRef.current.send(audioData);
      }
    });
  }, []);

  // Остановить запись команды
  const stopCommandRecording = useCallback(() => {
    console.log('🛑 Stopping command recording...');

    // Остановить аудио захват
    audioService.stopCapture();

    // Отправить stop событие (но НЕ отключаться от WebSocket)
    if (wsServiceRef.current.isConnected()) {
      wsServiceRef.current.stop();
    }

    // Очистить таймаут
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    // ВАЖНО: Вернуть состояние в waiting-wakeword
    setAssistantState(prev => ({
      ...prev,
      state: 'waiting-wakeword',
      partialTranscript: null
    }));

    console.log('✅ Recording stopped, state reset to waiting-wakeword');
  }, []);

  // Вернуться в режим ожидания wake-word
  const returnToWaitingMode = useCallback(() => {
    console.log('🔄 Returning to waiting mode...');

    setAssistantState(prev => ({
      ...prev,
      state: 'waiting-wakeword',
      partialTranscript: null,
      assistantQuestion: null,
      assistantMessage: null
    }));

    // Перезапустить детекцию wake-word если она остановлена
    if (!isListening) {
      console.log('👂 Restarting wake word detection...');
      startPorcupine();
    }
  }, [isListening, startPorcupine]);

  // Начать запись команды
  const startCommandRecording = useCallback(async () => {
    try {
      setAssistantState(prev => ({
        ...prev,
        state: 'recording-command',
        partialTranscript: null
      }));

      console.log('🎙️ Starting command recording...');

      // Определить callbacks заранее
      const wsCallbacks = {
        onReady: () => {
          console.log('✅ STT ready, starting audio capture...');
          startAudioCapture();
        },

        onPartial: (text: string) => {
          // Обновить partial транскрипт
          setAssistantState(prev => ({
            ...prev,
            partialTranscript: text
          }));
        },

        onFinal: async (text: string) => {
          // Получен final результат
          console.log('✅ Final transcript:', text);

          setAssistantState(prev => ({
            ...prev,
            state: 'processing',
            lastCommand: text,
            partialTranscript: null
          }));

          // Отправить на CLU для обработки
          try {
            console.log('🧠 Sending to CLU for intent recognition...');
            const cluResponse = await cluServiceRef.current.predict(text);

            // Остановить запись только после успешной отправки на CLU
            stopCommandRecording();

            // Детальный вывод результата CLU
            console.group('🎯 CLU Response Details');
            console.log('Top Intent:', cluResponse.topIntent);
            console.log('Confidence:', cluResponse.intents[0]?.confidenceScore);
            console.log('Entities:', cluResponse.entities);
            console.groupEnd();

            // Выполнить команду
            console.log('⚙️ Executing command with intent:', cluResponse.topIntent);

            // В обработчике onFinal:
            const result = await getDialogManager().process(
              cluResponse,
              text,
              commandContext // ← передаем актуальный контекст
            );

            console.log('📊 Command Execution Result:', {
              success: result.success,
              message: result.message,
              needsClarification: result.needsClarification
            });

            // ОБРАБОТКА РЕЗУЛЬТАТОВ
            if (result.needsClarification) {
              console.log('❓ Clarification needed:', result.clarificationQuestion);

              setAssistantState(prev => ({
                ...prev,
                state: 'awaiting-response',
                assistantQuestion: result.clarificationQuestion || null,
                assistantMessage: null
              }));

              setTimeout(() => {
                console.log('🎤 Auto-activating recording for response...');
                startCommandRecording();
              }, 1000);

            } else if (result.success && result.data) {
              // Команда выполнена успешно

              // Специальная обработка OpenJournal
              if (cluResponse.topIntent === 'OpenJournal' && result.data.type === 'journal_opened') {
                const opened = onOpenJournal(
                  result.data.classNumber,
                  result.data.classLetter,
                  result.data.groupNumber
                );

                if (!opened) {
                  setAssistantState(prev => ({
                    ...prev,
                    state: 'waiting-wakeword',
                    assistantMessage: 'Не удалось открыть журнал'
                  }));
                } else {
                  // Публикуем событие для UI
                  voiceCommandBus.emit(result.data.type, result.data);

                  setAssistantState(prev => ({
                    ...prev,
                    state: 'waiting-wakeword',
                    assistantMessage: result.message
                  }));
                }
              } else {
                // Другие команды - просто публикуем событие
                voiceCommandBus.emit(result.data.type, result.data);

                setAssistantState(prev => ({
                  ...prev,
                  state: 'waiting-wakeword',
                  assistantMessage: result.message
                }));
              }

              // Вернуться в режим ожидания через 3 секунды
              setTimeout(() => {
                returnToWaitingMode();
              }, 3000);

            } else {
              // Команда не удалась
              setAssistantState(prev => ({
                ...prev,
                state: 'waiting-wakeword',
                assistantMessage: result.message || 'Команда не выполнена'
              }));

              setTimeout(() => {
                returnToWaitingMode();
              }, 3000);
            }

          } catch (error) {
            console.error('❌ Failed to process command:', error);

            stopCommandRecording();

            setAssistantState(prev => ({
              ...prev,
              state: 'error',
              error: error instanceof Error ? error.message : 'Ошибка обработки команды',
              assistantQuestion: null,
              assistantMessage: null
            }));

            // Вернуться в режим ожидания через 3 секунды
            setTimeout(() => {
              returnToWaitingMode();
            }, 3000);
          }
        },

        onError: (error: string) => {
          console.error('❌ WebSocket error:', error);
          setAssistantState(prev => ({
            ...prev,
            state: 'error',
            error
          }));

          stopCommandRecording();
        }
      };

      // Проверить, подключен ли WebSocket, если нет - подключиться
      if (!wsServiceRef.current.isConnected()) {
        console.log('🔌 WebSocket not connected, connecting...');
        await wsServiceRef.current.connect(wsCallbacks);
      } else {
        console.log('✅ WebSocket already connected, updating callbacks and starting capture...');
        // ВАЖНО: Обновить callbacks даже если уже подключен!
        await wsServiceRef.current.connect(wsCallbacks);
      }

      // Установить таймаут максимальной длины записи
      recordingTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Max recording time reached');
        stopCommandRecording();

        setAssistantState(prev => ({
          ...prev,
          state: 'waiting-wakeword',
          assistantMessage: 'Время записи истекло'
        }));

        setTimeout(() => {
          returnToWaitingMode();
        }, 2000);
      }, VOICE_CONFIG.timeouts.maxRecordingTime);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      setAssistantState(prev => ({
        ...prev,
        state: 'error',
        error: error instanceof Error ? error.message : 'Ошибка записи'
      }));
    }
  }, [onOpenJournal, startAudioCapture, stopCommandRecording, returnToWaitingMode, getDialogManager]);


  // Обработка детекции wake-word
  useEffect(() => {
    if (keywordDetection && keywordDetection.label === VOICE_CONFIG.picovoice.wakeWord) {
      console.log(`🎯 Wake word "${VOICE_CONFIG.picovoice.wakeWord}" detected!`);

      setAssistantState(prev => ({
        ...prev,
        state: 'wakeword-detected',
        partialTranscript: null
      }));

      setTimeout(() => {
        startCommandRecording();
      }, VOICE_CONFIG.timeouts.wakeWordDelay);
    }
  }, [keywordDetection, startCommandRecording]);

  // Инициализация
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('⚠️ Already initialized, skipping...');
      return;
    }

    try {
      setAssistantState(prev => ({
        ...prev,
        state: 'initializing',
        error: null
      }));

      console.log('🚀 Initializing voice assistant...');

      // Инициализировать аудио сервис
      await audioService.initialize();
      console.log('✅ AudioService initialized');

      // Инициализировать Porcupine
      await init(
        VOICE_CONFIG.picovoice.accessKey,
        {
          publicPath: VOICE_CONFIG.picovoice.wakeWordPath,
          label: VOICE_CONFIG.picovoice.wakeWord
        },
        {
          publicPath: VOICE_CONFIG.picovoice.modelPath
        }
      );

      console.log('✅ Porcupine initialized');

      setAssistantState(prev => ({
        ...prev,
        state: 'waiting-wakeword',
        isActive: true,
        isMicAvailable: true
      }));

    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      setAssistantState(prev => ({
        ...prev,
        state: 'error',
        isActive: false,
        isMicAvailable: false,
        error: error instanceof Error ? error.message : 'Ошибка инициализации'
      }));
    }
  }, [init]);

  // Запуск
  const start = useCallback(async () => {
    await initialize();
  }, [initialize]);

  // Остановка
  const stop = useCallback(async () => {
    console.log('🛑 Stopping voice assistant completely...');

    // Остановить запись если идет
    stopCommandRecording();

    // Остановить wake-word детекцию
    if (isListening) {
      await stopPorcupine();
    }

    // Отключить WebSocket полностью
    wsServiceRef.current.disconnect();

    // Очистить аудио сервис
    audioService.dispose();

    isInitializedRef.current = false;

    setAssistantState({
      state: 'inactive',
      isActive: false,
      isMicAvailable: false,
      error: null,
      lastCommand: null,
      partialTranscript: null,
      assistantQuestion: null,
      assistantMessage: null,
    });

    console.log('✅ Voice assistant stopped completely');
  }, [isListening, stopPorcupine, stopCommandRecording]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        stopPorcupine();
        release();
        audioService.dispose();
        wsServiceRef.current.disconnect();
      }
    };
  }, [release, stopPorcupine]);

  return {
    state: assistantState.state,
    isActive: assistantState.isActive,
    isMicAvailable: assistantState.isMicAvailable,
    error: assistantState.error,
    lastCommand: assistantState.lastCommand,
    partialTranscript: assistantState.partialTranscript,
    assistantQuestion: assistantState.assistantQuestion,
    assistantMessage: assistantState.assistantMessage,
    start,
    stop,
    startManualRecording: startCommandRecording,
    stopManualRecording: stopCommandRecording
  };
};