export const VOICE_CONFIG = {
  picovoice: {
    accessKey: 'xyPprdlNFdFKVmbioY+4PjGXilmlSIGXaFqEmh+pQr5UPK5gOLSSAw==', // Замените!
    wakeWordPath: '/resources/Ai-Maral_en_wasm_v3_0_0.ppn',
    modelPath: '/porcupine_params.pv',
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
    language: 'ru-RU',
    clu: {
      projectName: 'RussianEduAssistCLU', // Использовать default из .env сервера
      deploymentName: 'FiveIntenst-phrase-deployment' // Использовать default из .env сервера
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