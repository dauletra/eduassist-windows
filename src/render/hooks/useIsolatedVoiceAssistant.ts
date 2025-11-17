// src/render/hooks/useIsolatedVoiceAssistant.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { createAudioService } from '../services/AudioService';
import { createWebSocketService } from '../services/WebSocketService';
import { createCLUService } from '../services/CLUService';
import { VOICE_CONFIG } from '../config/voiceConfig';
import { voiceCommandBus } from '../services/VoiceCommandBus';
import {createTTSService} from "../services/TTSService.ts";

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

  // Сервисы
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
  const ttsServiceRef = useRef(
    createTTSService({
      baseUrl: VOICE_CONFIG.api.baseUrl,
      apiKey: VOICE_CONFIG.api.apiKey,
      voiceName: VOICE_CONFIG.tts.voiceName,
      locale: VOICE_CONFIG.tts.locale,
      enabled: VOICE_CONFIG.tts.enabled,
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

  // Начать запись команды
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

  // ✅ НОВОЕ: Обработчик wakeword с голосовым ответом
  useEffect(() => {
    const handleWakeWordDetected = async () => {
      console.log('👂 Wake word detected!');

      // Произнести "тыңдап тұрмын"
      await ttsServiceRef.current.speak('Айта беріңіз...');

      updateState({ state: 'wakeword-detected', partialTranscript: null });

      setTimeout(() => {
        startCommandRecording();
      }, VOICE_CONFIG.timeouts.wakeWordDelay);
    };

    window.electronAPI.onWakeWordDetected(handleWakeWordDetected);
  }, [startCommandRecording, updateState]);

  // Обработчик CLU
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

        // ✅ НОВОЕ: Произнести ошибку
        await ttsServiceRef.current.speak('сізді дұрыс түсінбеген сияқтымын');

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

  useEffect(() => {
    const handleCommandExecuted = async (data: any) => {
      console.log('✅ Command executed:', data.result);

      if (data.result && data.result.message) {
        await ttsServiceRef.current.speak(data.result.message)
      }
    };

    const handleCommandFailed = async (error: any) => {
      console.error('❌ Command failed:', error);
      await ttsServiceRef.current.speak('команданы орындай алмадым');
    };

    const unsubscribeExecuted = voiceCommandBus.subscribe('command-executed', handleCommandExecuted);
    const unsubscribeFailed = voiceCommandBus.subscribe('command-failed', handleCommandFailed);

    return () => {
      unsubscribeExecuted();
      unsubscribeFailed();
    };
  }, []);

  // Подписка на событие wake-word от Node
  // useEffect(() => {
  //   window.electronAPI.onWakeWordDetected(() => {
  //     updateState({ state: 'wakeword-detected', partialTranscript: null });
  //     setTimeout(() => {
  //       startCommandRecording();
  //     }, VOICE_CONFIG.timeouts.wakeWordDelay);
  //   });
  // }, [startCommandRecording, updateState]);

  // Инициализация
  const start = useCallback(async () => {
    try {
      updateState({ state: 'initializing', error: null });

      await window.electronAPI.startVoiceListening();
      await audioServiceRef.current.initialize();

      // ✅ НОВОЕ: Инициализировать TTS и предзагрузить фразы
      await ttsServiceRef.current.initialize();
      await ttsServiceRef.current.preloadCommonPhrases(VOICE_CONFIG.tts.commonPhrases);

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
    await audioServiceRef.current.dispose();
    await ttsServiceRef.current.dispose();

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
      ttsServiceRef.current.dispose();
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