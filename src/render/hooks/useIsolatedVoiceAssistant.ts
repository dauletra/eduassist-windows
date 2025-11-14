// src/render/hooks/useIsolatedVoiceAssistant.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { createAudioService } from '../services/AudioService';
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

  const recordingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ ИЗМЕНЕНИЕ: Создаем экземпляры через factory функции
  const audioServiceRef = useRef(createAudioService());
  const wsServiceRef = useRef(
    createWebSocketService({
      baseUrl: VOICE_CONFIG.api.baseUrl,
      apiKey: VOICE_CONFIG.api.apiKey,
      language: VOICE_CONFIG.api.language,
    })
  );
  const cluServiceRef = useRef(
    createCLUService({
      baseUrl: VOICE_CONFIG.api.baseUrl,
      apiKey: VOICE_CONFIG.api.apiKey,
      locale: VOICE_CONFIG.api.language,
    })
  );

  // Обновление состояния + публикация событий
  const updateState = useCallback((updates: Partial<VoiceAssistantState>) => {
    setAssistantState(prev => {
      const newState = { ...prev, ...updates };

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

  // Начать захват аудио
  const startAudioCapture = useCallback(() => {
    audioServiceRef.current.startCapture((audioData) => {
      if (wsServiceRef.current.isConnected()) {
        wsServiceRef.current.send(audioData);
      }
    });
  }, []);

  // Остановить запись команды
  const stopCommandRecording = useCallback(() => {
    audioServiceRef.current.stopCapture();

    if (wsServiceRef.current.isConnected()) {
      wsServiceRef.current.stop();
    }

    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }

    updateState({
      state: 'waiting-wakeword',
      partialTranscript: null,
    });
  }, [updateState]);

  // Вернуться в режим ожидания wake-word
  const returnToWaitingMode = useCallback(() => {
    updateState({
      state: 'waiting-wakeword',
      partialTranscript: null,
      assistantQuestion: null,
      assistantMessage: null,
    });
  }, [updateState]);

  // ✅ ИЗМЕНЕНИЕ: Начать запись команды с разделенными колбеками
  const startCommandRecording = useCallback(async () => {
    try {
      updateState({
        state: 'recording-command',
        partialTranscript: null,
      });

      const wsCallbacks = {
        onReady: () => {
          startAudioCapture();
        },
        onPartial: (text: string) => {
          updateState({ partialTranscript: text });
        },
        // ✅ КЛЮЧЕВОЕ ИЗМЕНЕНИЕ: STT только публикует событие, не вызывает CLU
        onFinal: (text: string) => {
          console.log('🎤 STT Final:', text);

          // Публикуем событие "речь распознана"
          voiceCommandBus.publish('speech-recognized', { text });

          // Обновляем UI
          updateState({
            state: 'processing',
            lastCommand: text,
            partialTranscript: null,
          });

          // Останавливаем запись
          stopCommandRecording();
        },
        onError: (error: string) => {
          updateState({ state: 'error', error });
          stopCommandRecording();
        },
      };

      if (!wsServiceRef.current.isConnected()) {
        await wsServiceRef.current.connect(wsCallbacks);
      } else {
        await wsServiceRef.current.connect(wsCallbacks);
      }

      recordingTimeoutRef.current = setTimeout(() => {
        stopCommandRecording();
        updateState({
          state: 'waiting-wakeword',
          assistantMessage: 'Время записи истекло',
        });
        setTimeout(() => {
          returnToWaitingMode();
        }, 2000);
      }, VOICE_CONFIG.timeouts.maxRecordingTime);
    } catch (error) {
      updateState({
        state: 'error',
        error: error instanceof Error ? error.message : 'Ошибка записи',
      });
    }
  }, [startAudioCapture, stopCommandRecording, returnToWaitingMode, updateState]);

  // ✅ НОВОЕ: Отдельный обработчик для CLU (подписывается на событие 'speech-recognized')
  useEffect(() => {
    const handleSpeechRecognized = async ({ text }: { text: string }) => {
      console.log('🧠 Processing with CLU:', text);

      try {
        const cluResponse = await cluServiceRef.current.predict(text);

        // Публикуем событие "команда распознана" с intent и entities
        voiceCommandBus.publish('command-recognized', {
          text,
          intent: cluResponse.topIntent,
          entities: cluResponse.entities,
          cluResponse,
        });

        updateState({
          assistantMessage: 'Команда распознана',
        });

        setTimeout(() => {
          returnToWaitingMode();
        }, 2000);

      } catch (error) {
        console.error('❌ CLU failed:', error);
        updateState({
          state: 'error',
          error: error instanceof Error ? error.message : 'Ошибка обработки команды',
        });

        setTimeout(() => {
          returnToWaitingMode();
        }, 3000);
      }
    };

    // ✅ Подписываемся на событие распознавания речи
    const unsubscribe = voiceCommandBus.subscribe('speech-recognized', handleSpeechRecognized);

    return unsubscribe;
  }, [returnToWaitingMode, updateState]);

  // Подписка на событие wake-word от Node
  useEffect(() => {
    window.electronAPI.onWakeWordDetected(() => {
      updateState({ state: 'wakeword-detected', partialTranscript: null });
      setTimeout(() => {
        startCommandRecording();
      }, VOICE_CONFIG.timeouts.wakeWordDelay);
    });
  }, [startCommandRecording, updateState]);

  // Инициализация
  const start = useCallback(async () => {
    try {
      updateState({ state: 'initializing', error: null });

      await window.electronAPI.startVoiceListening();
      await audioServiceRef.current.initialize();

      updateState({
        isActive: true,
        isMicAvailable: true,
        state: 'waiting-wakeword',
      });
    } catch (error) {
      console.error('❌ Voice assistant start failed:', error);
      updateState({
        state: 'error',
        isActive: false,
        isMicAvailable: false,
        error: error instanceof Error ? error.message : 'Ошибка инициализации',
      });
    }
  }, [updateState]);

  const stop = useCallback(async () => {
    stopCommandRecording();
    await window.electronAPI.stopVoiceListening();
    audioServiceRef.current.dispose();
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
  }, [stopCommandRecording, updateState]);

  useEffect(() => {
    return () => {
      audioServiceRef.current.dispose();
      wsServiceRef.current.disconnect();
    };
  }, []);

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
    returnToWaitingMode,
  };
};