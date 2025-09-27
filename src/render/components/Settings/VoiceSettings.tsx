import { useState, useEffect } from 'react';

interface VoiceSettings {
  voice: {
    language: string;
    keyWord: string;
    confidence: number;
    autoStart: boolean;
    responseEnabled: boolean;
  };
}

const VoiceSettings = () => {
  const [settings, setSettings] = useState<VoiceSettings>({
    voice: {
      language: 'ru-RU',
      keyWord: 'марал',
      confidence: 0.7,
      autoStart: true,
      responseEnabled: true,
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await window.electronAPI.loadSettings();
      if (data?.voice) {
        setSettings(prev => ({ ...prev, voice: data.voice }));
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const updateSetting = async <K extends keyof VoiceSettings['voice']>(
    key: K,
    value: VoiceSettings['voice'][K]
  ) => {
    const updated = {
      ...settings,
      voice: {
        ...settings.voice,
        [key]: value
      }
    };
    setSettings(updated);

    try {
      await window.electronAPI.saveSettings(updated);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  return (
    <div className="space-y-6">
    <h3 className="text-lg font-medium text-gray-800">Голосовой ассистент</h3>

  {/* Язык распознавания */}
  <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Язык распознавания
  </label>
  <select
  value={settings.voice.language}
  onChange={(e) => updateSetting('language', e.target.value)}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
  <option value="ru-RU">Русский</option>
    <option value="en-US">English</option>
    <option value="kk-KZ">Қазақша</option>
    </select>
    </div>

  {/* Ключевое слово */}
  <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Ключевое слово для активации
  </label>
  <input
  type="text"
  value={settings.voice.keyWord}
  onChange={(e) => updateSetting('keyWord', e.target.value.toLowerCase())}
  placeholder="марал"
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  <p className="text-xs text-gray-500">
    Произнесите это слово для активации голосового ассистента
  </p>
  </div>

  {/* Точность распознавания */}
  <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Минимальная точность распознавания: {Math.round(settings.voice.confidence * 100)}%
  </label>
  <input
  type="range"
  min="0"
  max="1"
  step="0.05"
  value={settings.voice.confidence}
  onChange={(e) => updateSetting('confidence', parseFloat(e.target.value))}
  className="w-full"
  />
  <div className="flex justify-between text-xs text-gray-500">
    <span>Низкая (больше ложных срабатываний)</span>
  <span>Высокая (меньше срабатываний)</span>
  </div>
  </div>

  {/* Автозапуск */}
  <div className="flex items-center justify-between py-3">
  <div>
    <label className="text-sm font-medium text-gray-700">
    Автоматический запуск
  </label>
  <p className="text-xs text-gray-500 mt-1">
    Начинать прослушивание при запуске приложения
  </p>
  </div>
  <button
  onClick={() => updateSetting('autoStart', !settings.voice.autoStart)}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    settings.voice.autoStart ? 'bg-blue-600' : 'bg-gray-300'
  }`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    settings.voice.autoStart ? 'translate-x-6' : 'translate-x-1'
  }`}
  />
  </button>
  </div>

  {/* Голосовые ответы */}
  <div className="flex items-center justify-between py-3">
  <div>
    <label className="text-sm font-medium text-gray-700">
    Голосовые ответы
  </label>
  <p className="text-xs text-gray-500 mt-1">
    Озвучивать результаты выполнения команд
  </p>
  </div>
  <button
  onClick={() => updateSetting('responseEnabled', !settings.voice.responseEnabled)}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    settings.voice.responseEnabled ? 'bg-blue-600' : 'bg-gray-300'
  }`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    settings.voice.responseEnabled ? 'translate-x-6' : 'translate-x-1'
  }`}
  />
  </button>
  </div>
  </div>
);
};

export default VoiceSettings;