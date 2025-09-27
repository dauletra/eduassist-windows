import { useState, useEffect } from 'react';

interface GradesSettings {
  education: {
    gradeScale: {
      min: number;
      max: number;
    };
    autoSaveGrades: boolean;
    printTasksTemplate: string;
  };
}

const GradesSettings = () => {
  const [settings, setSettings] = useState<GradesSettings>({
    education: {
      gradeScale: {
        min: 1,
        max: 10
      },
      autoSaveGrades: true,
      printTasksTemplate: 'default'
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await window.electronAPI.loadSettings();
      if (data?.education) {
        setSettings(prev => ({ ...prev, education: data.education }));
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    }
  };

  const updateSetting = async (updates: Partial<GradesSettings['education']>) => {
    const updated = {
      ...settings,
      education: {
        ...settings.education,
        ...updates
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
    <h3 className="text-lg font-medium text-gray-800">Система оценивания</h3>

  {/* Шкала оценок */}
  <div className="space-y-4">
  <label className="block text-sm font-medium text-gray-700">
    Шкала оценок
  </label>
  <div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-xs text-gray-600 mb-1">
    Минимальная оценка
  </label>
  <input
  type="number"
  min="1"
  max="5"
  value={settings.education.gradeScale.min}
  onChange={(e) => updateSetting({
    gradeScale: {
      ...settings.education.gradeScale,
      min: parseInt(e.target.value)
    }
  })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  />
  </div>
  <div>
  <label className="block text-xs text-gray-600 mb-1">
    Максимальная оценка
  </label>
  <input
  type="number"
  min="5"
  max="100"
  value={settings.education.gradeScale.max}
  onChange={(e) => updateSetting({
    gradeScale: {
      ...settings.education.gradeScale,
      max: parseInt(e.target.value)
    }
  })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    </div>
    </div>
    <p className="text-xs text-gray-500">
    Текущая шкала: от {settings.education.gradeScale.min} до {settings.education.gradeScale.max}
  </p>
  </div>

  {/* Автосохранение */}
  <div className="flex items-center justify-between py-3">
  <div>
    <label className="text-sm font-medium text-gray-700">
    Автоматическое сохранение оценок
  </label>
  <p className="text-xs text-gray-500 mt-1">
    Сохранять оценки сразу после выставления
  </p>
  </div>
  <button
  onClick={() => updateSetting({ autoSaveGrades: !settings.education.autoSaveGrades })}
  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
    settings.education.autoSaveGrades ? 'bg-blue-600' : 'bg-gray-300'
  }`}
>
  <span
    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
    settings.education.autoSaveGrades ? 'translate-x-6' : 'translate-x-1'
  }`}
  />
  </button>
  </div>

  {/* Шаблон печати */}
  <div className="space-y-2">
  <label className="block text-sm font-medium text-gray-700">
    Шаблон печати задач
  </label>
  <select
  value={settings.education.printTasksTemplate}
  onChange={(e) => updateSetting({ printTasksTemplate: e.target.value })}
  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
  <option value="default">Стандартный</option>
    <option value="compact">Компактный</option>
    <option value="detailed">Подробный</option>
    </select>
    </div>
    </div>
);
};

export default GradesSettings;