import { useState } from 'react';
import { Settings as SettingsIcon } from 'lucide-react';
import GroupSelector from './GroupSelector';
import StudentJournal from './StudentJournal';
import Settings from './Settings';
import type { SelectedGroup, Class, Lesson } from '../types';


interface SidebarProps {
  appData: Class[] | null;
  loading: boolean;
  selectedGroup: SelectedGroup | null;
  currentLesson: Lesson | null;
  getStudentName: (name: string) => string;
  onGroupSelect: (groupId: string) => void;
  onBackToGroups: () => void;
  onUpdateGrade: (lessonId: string, studentId: string, grade: number | null) => Promise<void>;
  onUpdateAttendance: (lessonId: string, studentId: string, attendance: boolean) => Promise<void>;
  onSettingsUpdate: () => void;
}

const Sidebar = ({ 
  appData,
  loading, 
  selectedGroup,
  currentLesson,
  getStudentName,
  onGroupSelect,
  onBackToGroups,
  onUpdateGrade,
  onUpdateAttendance,
  onSettingsUpdate,
}: SidebarProps) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Контент сайдбара */}
        <div className="flex-1 overflow-y-auto">
          {!selectedGroup ? (
              <GroupSelector
                appData={appData}
                loading={loading}
                onGroupSelect={onGroupSelect}
              />
          ) : (
            currentLesson && (
              <StudentJournal
                selectedGroup={selectedGroup}
                currentLesson={currentLesson}
                getStudentName={getStudentName}
                onBack={onBackToGroups}
                onUpdateGrade={onUpdateGrade}
                onUpdateAttendance={onUpdateAttendance}
              />
            )
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">
          Настройки
        </h2>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          title="Настройки"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>


      {/* Модальное окно настроек */}
      <Settings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsUpdate={onSettingsUpdate}
      />
    </>
  );
};

export default Sidebar;