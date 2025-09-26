import { useState } from "react";
import { FileText, Dice1, Monitor } from "lucide-react";
import FilesTab from "./FilesTab.tsx";
import DevicesTab from "./DevicesTab.tsx";
import RandomizerTab from "./RandomizerTab";
import type { SelectedGroup, Lesson, Group } from "../types";

interface TabBarProps {
  selectedGroup: SelectedGroup | null;
  currentLesson: Lesson | null;
  groupData: Group | null;
  className?: string;
}

const TabBar = ({ selectedGroup, currentLesson, groupData, className }: TabBarProps) => {
  const [activeTab, setActiveTab] = useState('randomizer');

  const tabs = [
    { id: "randomizer", icon: Dice1, label: "Рандомайзер" },
    { id: 'files', icon: FileText, label: 'Файлы' },
    { id: 'devices', icon: Monitor, label: 'Устройства' },
  ];

  return (
    <div className={`flex flex-col bg-gray-100 border-t border-gray-200 ${className}`}>
      {/* Простые закругленные вкладки */}
      <div className="flex bg-gray-100 px-2 pt-1">
        {tabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            className={`
              flex items-center gap-2 px-4 py-2 mx-1 text-sm rounded-t-lg
              ${activeTab === id
              ? 'bg-white text-gray-800 border-t border-l border-r border-gray-200'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }
            `}
            onClick={() => setActiveTab(id)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Контент вкладок */}
      <div className="flex-1 bg-white border-t border-gray-200 overflow-y-auto">
        {!selectedGroup ? (
          <div className="flex items-center justify-center h-full p-8">
            <div className="text-center">
              <FileText size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">Откройте журнал</h3>
              <p className="text-gray-500">Выберите класс и группу для доступа к инструментам</p>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            {activeTab === 'randomizer' && (
              <RandomizerTab
                selectedGroup={selectedGroup}
                currentLesson={currentLesson}
                groupData={groupData}
              />
            )}
            {activeTab === 'files' && <FilesTab />}
            {activeTab === 'devices' && <DevicesTab />}
          </div>
        )}
      </div>
    </div>
  );
};

export default TabBar;