import { useState, useEffect, useCallback, useRef } from 'react';
import { usePorcupine } from '@picovoice/porcupine-react';
import { audioService } from '../services/AudioService';
import { VOICE_CONFIG } from '../config/voiceConfig';

export type AssistantState =
  | 'inactive'
  | 'initializing'
  | 'waiting-wakeword'
  | 'wakeword-detected'
  | 'recording-command'
  | 'processing'
  | 'error';

interface VoiceAssistantState {
  state: AssistantState;
  isActive: boolean;
  isMicAvailable: boolean;
  error: string | null;
  lastCommand: string | null;
}

export const useVoiceAssistant = () => {
  const [assistantState, setAssistantState] = useState<VoiceAssistantState>({
    state: 'inactive',
    isActive: false,
    isMicAvailable: false,
    error: null,
    lastCommand: null
  });

  const isInitializedRef = useRef(false);

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
    if (keywordDetection && keywordDetection.label === 'Ai Maral') {
      console.log('🎯 Wake word "Ai Maral" detected!');

      setAssistantState(prev => ({
        ...prev,
        state: 'wakeword-detected'
      }));

      setTimeout(() => {
        setAssistantState(prev => ({
          ...prev,
          state: 'recording-command'
        }));
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
    console.log('🛑 Stopping voice assistant...');

    if (isListening) {
      await stopPorcupine();
    }

    audioService.stopCapture();
    isInitializedRef.current = false;

    setAssistantState({
      state: 'inactive',
      isActive: false,
      isMicAvailable: false,
      error: null,
      lastCommand: null
    });

    console.log('✅ Voice assistant stopped');
  }, [isListening, stopPorcupine]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isInitializedRef.current) {
        stopPorcupine();
        release();
        audioService.dispose();
      }
    };
  }, [release, stopPorcupine]);

  return {
    state: assistantState.state,
    isActive: assistantState.isActive,
    isMicAvailable: assistantState.isMicAvailable,
    error: assistantState.error,
    lastCommand: assistantState.lastCommand,
    start,
    stop
  };
};