// src/render/components/Settings/SettingsApp.tsx

import { useState } from 'react';
import GeneralSettings from './GeneralSettings';
import ClassesSettings from './ClassesSettings';
import VoiceSettings from './VoiceSettings';
import GradesSettings from './GradesSettings';

const SettingsApp = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'classes' | 'voice' | 'grades'>('general');

  const tabs = [
    { id: 'general', label: 'Общие' },
    { id: 'classes', label: 'Классы и группы' },
    { id: 'voice', label: 'Голосовой ассистент' },
    { id: 'grades', label: 'Оценки' },
  ] as const;

  const handleSettingsUpdate = () => {
    // Отправляем сообщение главному окну об обновлении данных
    window.electronAPI.notifyMainWindow('settings-updated');
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Шапка */}
      <div className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-semibold text-gray-800">Настройки</h1>
      </div>

      {/* Вкладки */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Контент вкладок */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'classes' && <ClassesSettings onUpdate={handleSettingsUpdate} />}
          {activeTab === 'voice' && <VoiceSettings />}
          {activeTab === 'grades' && <GradesSettings />}
        </div>
      </div>
    </div>
  );
};

export default SettingsApp;