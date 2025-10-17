import { useState, useEffect, useCallback, useRef } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';
import { audioService } from '../services/AudioService';
import { createWebSocketService } from '../services/WebSocketService';
import { createCLUService } from '../services/CLUService';
import { commandExecutor } from '../services/CommandExecutor.ts';
import { VOICE_CONFIG } from '../config/voiceConfig';

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

export const useVoiceAssistant = () => {
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>({
    state: 'inactive',
    isActive: false,
    isMicAvailable: false,
    error: null,
    lastCommand: null,
    partialTranscript: null,
    assistantQuestion: null,
    assistantMessage: null
  });

  const isInitializedRef = useRef(false);
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
  }, [keywordDetection]);

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
          console.log('🔍 Starting command processing pipeline...');

          setAssistantState(prev => ({
            ...prev,
            state: 'processing',
            lastCommand: text,
            partialTranscript: null
          }));

          console.log('📞 About to call CLU service...');

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
            console.log('All Intents:', cluResponse.intents);
            console.log('Entities Count:', cluResponse.entities.length);

            if (cluResponse.entities.length > 0) {
              console.log('📋 Extracted Entities:');
              cluResponse.entities.forEach((entity, index) => {
                console.log(`  ${index + 1}. ${entity.category}: "${entity.text}" (confidence: ${entity.confidenceScore})`);
              });
            } else {
              console.log('No entities extracted');
            }

            console.log('Raw CLU Response:', cluResponse.raw);
            console.groupEnd();

            // Выполнить команду
            console.log('⚙️ Executing command with intent:', cluResponse.topIntent);
            const result = await commandExecutor.execute(cluResponse);

            console.log('📊 Command Execution Result:', {
              success: result.success,
              message: result.message,
              needsClarification: result.needsClarification,
              question: result.clarificationQuestion
            });

            if (result.needsClarification) {
              // Нужно уточнение - ждем ответа пользователя
              console.log('❓ Clarification needed:', result.clarificationQuestion);

              setAssistantState(prev => ({
                ...prev,
                state: 'awaiting-response',
                assistantQuestion: result.clarificationQuestion || null,
                assistantMessage: null
              }));

              // Автоматически активировать запись для ответа через 1 секунду
              setTimeout(() => {
                console.log('🎤 Auto-activating recording for response...');
                startCommandRecording();
              }, 1000);

            } else {
              // Команда выполнена успешно
              console.log('✅ Command executed successfully:', result.message);

              setAssistantState(prev => ({
                ...prev,
                state: 'waiting-wakeword',
                assistantQuestion: null,
                assistantMessage: result.message
              }));

              // Вернуться в режим ожидания через 3 секунды
              setTimeout(() => {
                returnToWaitingMode();
              }, 3000);
            }

          } catch (error) {
            console.error('❌ Failed to process command:', error);
            console.error('Error details:', {
              name: error instanceof Error ? error.name : 'Unknown',
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });

            // Остановить запись в случае ошибки
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
  }, []);

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
      assistantMessage: null
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
    stop
  };
};