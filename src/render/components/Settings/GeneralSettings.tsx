import { useState, useEffect } from 'react';

interface AppSettings {
  ui: {
    theme: 'light' | 'dark' | 'auto';
    language: 'ru' | 'en' | 'kk';
    animations: boolean;
    showNotifications: boolean;
  };
}

const GeneralSettings = () => {
  const [settings, setSettings] = useState<AppSettings>({
    ui: {
      theme: 'light',
      language: 'ru',
      animations: true,
      showNotifications: true,
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await window.settings.loadSettings();
      if (data?.ui) {
        setSettings(prev => ({ ...prev, ui: data.ui }));
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const updateSetting = async <K extends keyof AppSettings['ui']>(
    key: K,
    value: AppSettings['ui'][K]
  ) => {
    const updated = {
      ...settings,
      ui: {
        ...settings.ui,
        [key]: value
      }
    };
    setSettings(updated);

    try {
      await window.settings.saveSettings(updated);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-800">Общие настройки</h3>

      {/* Тема */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Тема интерфейса
        </label>
        <select
          value={settings.ui.theme}
          onChange={(e) => updateSetting('theme', e.target.value as AppSettings['ui']['theme'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="light">Светлая</option>
          <option value="dark">Темная</option>
          <option value="auto">Автоматически</option>
        </select>
      </div>

      {/* Язык */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Язык интерфейса
        </label>
        <select
          value={settings.ui.language}
          onChange={(e) => updateSetting('language', e.target.value as AppSettings['ui']['language'])}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ru">Русский</option>
          <option value="en">English</option>
          <option value="kk">Қазақша</option>
        </select>
      </div>

      {/* Анимации */}
      <div className="flex items-center justify-between py-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Анимации интерфейса
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Включить плавные переходы и анимации
          </p>
        </div>
        <button
          onClick={() => updateSetting('animations', !settings.ui.animations)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.ui.animations ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.ui.animations ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Уведомления */}
      <div className="flex items-center justify-between py-3">
        <div>
          <label className="text-sm font-medium text-gray-700">
            Уведомления
          </label>
          <p className="text-xs text-gray-500 mt-1">
            Показывать системные уведомления
          </p>
        </div>
        <button
          onClick={() => updateSetting('showNotifications', !settings.ui.showNotifications)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.ui.showNotifications ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.ui.showNotifications ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default GeneralSettings;