// hooks/useIsolatedVoiceAssistant.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';
import { audioService } from '../services/AudioService';
import { createWebSocketService } from '../services/WebSocketService';
import { createCLUService } from '../services/CLUService';
import { VOICE_CONFIG } from '../config/voiceConfig';
import { voiceCommandBus } from '../services/VoiceCommandBus';

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

export const useIsolatedVoiceAssistant = () => {
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

  const isInitializedRef = useRef(false);
  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Обновление состояния с публикацией событий
  const updateState = useCallback((updates: Partial<VoiceAssistantState>) => {
    setAssistantState(prev => {
      const newState = { ...prev, ...updates };

      // Публикуем события в bus
      if (updates.state !== undefined) {
        voiceCommandBus.publish('state-changed', updates.state);
      }
      if (updates.error !== undefined) {
        voiceCommandBus.publish('voice-error', updates.error);
      }
      if (updates.assistantQuestion !== undefined) {
        voiceCommandBus.publish('assistant-question', updates.assistantQuestion);
      }
      if (updates.assistantMessage !== undefined) {
        voiceCommandBus.publish('assistant-message', updates.assistantMessage);
      }

      return newState;
    });
  }, []);

  // Обработка ошибок Porcupine
  useEffect(() => {
    if (porcupineError) {
      console.error('❌ Porcupine error:', porcupineError);
      updateState({
        state: 'error',
        error: porcupineError.toString()
      });
    }
  }, [porcupineError, updateState]);

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
      if (wsServiceRef.current.isConnected()) {
        wsServiceRef.current.send(audioData);
      }
    });
  }, []);

  // Остановить запись команды
  const stopCommandRecording = useCallback(() => {
    console.log('🛑 Stopping command recording...');

    audioService.stopCapture();

    if (wsServiceRef.current.isConnected()) {
      wsServiceRef.current.stop();
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    updateState({
      state: 'waiting-wakeword',
      partialTranscript: null
    });

    console.log('✅ Recording stopped, state reset to waiting-wakeword');
  }, [updateState]);

  // Вернуться в режим ожидания wake-word
  const returnToWaitingMode = useCallback(() => {
    console.log('🔄 Returning to waiting mode...');

    updateState({
      state: 'waiting-wakeword',
      partialTranscript: null,
      assistantQuestion: null,
      assistantMessage: null
    });

    if (!isListening) {
      console.log('👂 Restarting wake word detection...');
      startPorcupine();
    }
  }, [isListening, startPorcupine, updateState]);

  // Начать запись команды
  const startCommandRecording = useCallback(async () => {
    try {
      updateState({
        state: 'recording-command',
        partialTranscript: null
      });

      console.log('🎙️ Starting command recording...');

      const wsCallbacks = {
        onReady: () => {
          console.log('✅ STT ready, starting audio capture...');
          startAudioCapture();
        },

        onPartial: (text: string) => {
          updateState({
            partialTranscript: text
          });
        },

        onFinal: async (text: string) => {
          console.log('✅ Final transcript:', text);

          updateState({
            state: 'processing',
            lastCommand: text,
            partialTranscript: null
          });

          try {
            console.log('🧠 Sending to CLU for intent recognition...');
            const cluResponse = await cluServiceRef.current.predict(text);

            // ПУБЛИКУЕМ СОБЫТИЕ В BUS
            voiceCommandBus.publish('command-recognized', {
              text,
              intent: cluResponse.topIntent,
              entities: cluResponse.entities,
              cluResponse
            });

            // Останавливаем запись
            stopCommandRecording();

            // Устанавливаем сообщение об успехе
            updateState({
              assistantMessage: 'Команда распознана'
            });

            // Автоматически возвращаемся в режим ожидания
            setTimeout(() => {
              returnToWaitingMode();
            }, 2000);

          } catch (error) {
            console.error('❌ Failed to process command:', error);

            stopCommandRecording();

            updateState({
              state: 'error',
              error: error instanceof Error ? error.message : 'Ошибка обработки команды',
              assistantQuestion: null,
              assistantMessage: null
            });

            setTimeout(() => {
              returnToWaitingMode();
            }, 3000);
          }
        },

        onError: (error: string) => {
          console.error('❌ WebSocket error:', error);
          updateState({
            state: 'error',
            error
          });

          stopCommandRecording();
        }
      };

      // Подключаем WebSocket
      if (!wsServiceRef.current.isConnected()) {
        console.log('🔌 WebSocket not connected, connecting...');
        await wsServiceRef.current.connect(wsCallbacks);
      } else {
        console.log('✅ WebSocket already connected, updating callbacks and starting capture...');
        await wsServiceRef.current.connect(wsCallbacks);
      }

      // Таймаут максимальной длины записи
      recordingTimeoutRef.current = setTimeout(() => {
        console.log('⏱️ Max recording time reached');
        stopCommandRecording();

        updateState({
          state: 'waiting-wakeword',
          assistantMessage: 'Время записи истекло'
        });

        setTimeout(() => {
          returnToWaitingMode();
        }, 2000);
      }, VOICE_CONFIG.timeouts.maxRecordingTime);

    } catch (error) {
      console.error('❌ Failed to start recording:', error);
      updateState({
        state: 'error',
        error: error instanceof Error ? error.message : 'Ошибка записи'
      });
    }
  }, [startAudioCapture, stopCommandRecording, returnToWaitingMode, updateState]);

  // Обработка детекции wake-word
  useEffect(() => {
    if (keywordDetection && keywordDetection.label === VOICE_CONFIG.picovoice.wakeWord) {
      console.log(`🎯 Wake word "${VOICE_CONFIG.picovoice.wakeWord}" detected!`);

      updateState({
        state: 'wakeword-detected',
        partialTranscript: null
      });

      setTimeout(() => {
        startCommandRecording();
      }, VOICE_CONFIG.timeouts.wakeWordDelay);
    }
  }, [keywordDetection, startCommandRecording, updateState]);

  // Инициализация
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) {
      console.log('⚠️ Already initialized, skipping...');
      return;
    }

    try {
      updateState({
        state: 'initializing',
        error: null
      });

      console.log('🚀 Initializing voice assistant...');

      await audioService.initialize();
      console.log('✅ AudioService initialized');

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

      updateState({
        state: 'waiting-wakeword',
        isActive: true,
        isMicAvailable: true
      });

    } catch (error) {
      console.error('❌ Failed to initialize:', error);
      updateState({
        state: 'error',
        isActive: false,
        isMicAvailable: false,
        error: error instanceof Error ? error.message : 'Ошибка инициализации'
      });
    }
  }, [init, updateState]);

  // Запуск
  const start = useCallback(async () => {
    await initialize();
  }, [initialize]);

  // Остановка
  const stop = useCallback(async () => {
    console.log('🛑 Stopping voice assistant completely...');

    stopCommandRecording();

    if (isListening) {
      await stopPorcupine();
    }

    wsServiceRef.current.disconnect();
    audioService.dispose();

    isInitializedRef.current = false;

    updateState({
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
  }, [isListening, stopPorcupine, stopCommandRecording, updateState]);

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
    stopManualRecording: stopCommandRecording,
    returnToWaitingMode
  };
};