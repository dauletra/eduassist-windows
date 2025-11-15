import { useState, useEffect } from "react";
import { FileText, Dice1, Monitor, LayoutGrid, ClipboardList } from "lucide-react";
import FilesTab from "./FilesTab.tsx";
import DevicesTab from "./DevicesTab.tsx";
import RandomizerTab from "./RandomizerTab";
import { SeatingChart } from "./SeatingChart.tsx";
import TasksTab from "./TasksTab";
import type { LessonFolder } from "../types";
import { commandEventBus } from "../services/CommandEventBus.ts";
import {useAppState} from "../contexts/StoreContext.tsx";

interface TabBarProps {
  className?: string;
}

const TabBar = ({ className }: TabBarProps) => {

  const state = useAppState()
  const { selectedGroup, currentLesson, currentGroup } = state;

  const [activeTab, setActiveTab] = useState('randomizer');
  const [selectedLesson, setSelectedLesson] = useState<LessonFolder | null>(null);

  useEffect(() => {
    // Карта команд -> вкладки
    const commandToTab: Record<string, string> = {
      'random_student': 'randomizer',
      'groups_formed': 'randomizer',
      'grade_set': 'tasks', // или другая вкладка где показываются оценки
    };

    const unsubscribes: (() => void)[] = [];

    // Подписаться на все команды
    Object.keys(commandToTab).forEach(commandType => {
      const unsubscribe = commandEventBus.subscribe(commandType, () => {
        const targetTab = commandToTab[commandType];
        console.log(`🔀 Auto-switching to tab: ${targetTab}`);
        setActiveTab(targetTab);
      });
      unsubscribes.push(unsubscribe);
    });

    // Cleanup
    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  const tabs = [
    { id: 'seating', icon: LayoutGrid, label: 'Рассадка' },
    { id: 'tasks', icon: ClipboardList, label: 'Задания' },
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
            <div className={activeTab === 'seating' ? '' : 'hidden'}>
              <SeatingChart
                selectedGroup={selectedGroup}
                currentLesson={currentLesson}
                groupData={currentGroup}
              />
            </div>
            <div className={activeTab === 'tasks' ? '' : 'hidden'}>
              <TasksTab
                selectedGroup={selectedGroup}
                currentLesson={currentLesson}
                groupData={currentGroup}
              />
            </div>
            <div className={activeTab === 'randomizer' ? '' : 'hidden'}>
              <RandomizerTab />
            </div>
            <div className={activeTab === 'files' ? '' : 'hidden'}>
              <FilesTab
                selectedGroup={selectedGroup}
                selectedLesson={selectedLesson}
                onLessonChange={setSelectedLesson}
              />
            </div>
            <div className={activeTab === 'devices' ? '' : 'hidden'}>
              <DevicesTab isActive={activeTab === 'devices'} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TabBar;