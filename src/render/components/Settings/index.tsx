import { useState } from 'react';
import { X } from 'lucide-react';
import GeneralSettings from './GeneralSettings';
import ClassesSettings from './ClassesSettings';
import VoiceSettings from './VoiceSettings';
import GradesSettings from './GradesSettings';

interface SettingsProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdate: () => void;
}

const Settings = ({ isOpen, onClose, onSettingsUpdate }: SettingsProps) => {
  const [activeTab, setActiveTab] = useState<'general' | 'classes' | 'voice' | 'grades'>('general');

  if (!isOpen) return null;

  const tabs = [
    { id: 'general', label: 'Общие' },
    { id: 'classes', label: 'Классы и группы' },
    { id: 'voice', label: 'Голосовой ассистент' },
    { id: 'grades', label: 'Оценки' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[600px] flex flex-col">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Настройки</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b px-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-600 border-transparent hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Контент вкладок */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'general' && <GeneralSettings />}
          {activeTab === 'classes' && <ClassesSettings onUpdate={onSettingsUpdate} />}
          {activeTab === 'voice' && <VoiceSettings />}
          {activeTab === 'grades' && <GradesSettings />}
        </div>

        {/* Футер */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;