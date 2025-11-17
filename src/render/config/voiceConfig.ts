// src/render/config/voiceConfig.ts

export const VOICE_CONFIG = {
  picovoice: {
    // accessKey: 'xyPprdlNFdFKVmbioY+4PjGXilmlSIGXaFqEmh+pQr5UPK5gOLSSAw==', // Wasm!
    accessKey: 'POZ3tE0eQkgUjDsoG/DVqsuoW5j6JfuJjIQPbjM5o1VuKMI/vuYNBg==', // Windows old
    // accessKey: 'dx5Zvoxj3sllkNwAbq2nJkrLygfn4S8NWPlCbh/NPwzLlnxNMxS2QA==', // Windows!
    // wakeWordPath: '/resources/Ai-Maral_en_wasm_v3_0_0.ppn',
    // modelPath: '/porcupine_params.pv',
    wakeWord: 'Ai Maral'
  },

  audio: {
    sampleRate: 16000,
    channelCount: 1,
    frameSize: 512,
    streamFrameSize: 640
  },

  api: {
    baseUrl: 'http://localhost:8080',
    apiKey: 'your_api_key_for_clients',
    endpoints: {
      sttStream: '/v1/speech/stt/stream',
      stt: '/v1/speech/stt',
      tts: '/v1/speech/tts',
      clu: '/v1/clu/predict'
    },
    language: 'kk-KZ',
    clu: {
      projectName: 'KazakhConversationTeacher', // Использовать default из .env сервера
      deploymentName: 'kazakh-clu-three' // Использовать default из .env сервера
    }
  },

  timeouts: {
    wakeWordDelay: 500,
    maxRecordingTime: 10000,
    silenceTimeout: 1500,
    commandProcessingTimeout: 5000,
    messageDisplayTime: 3000
  }
} as const;