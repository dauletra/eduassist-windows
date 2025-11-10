import { Settings as SettingsIcon } from 'lucide-react';
import GroupSelector from './GroupSelector';
import StudentJournal from './StudentJournal';
import { useAppState } from '../contexts/StoreContext';
import type { SelectedGroup } from '../types';


interface SidebarProps {
  getStudentName: (studentId: string) => string;
  onGroupSelect: (groupId: string) => void;
  onBackToGroups: () => void;
  onLessonChange: (lesson: string) => void;
  onUpdateGrade: (studentId: string, grade: number | null) => Promise<void>;
  onUpdateAttendance: (studentId: string, attendance: boolean) => Promise<void>;
  onSettingsUpdate: () => Promise<void>;
}

const Sidebar = ({
                   getStudentName,
                   onGroupSelect,
                   onBackToGroups,
                   onLessonChange,
                   onUpdateGrade,
                   onUpdateAttendance,
                 }: SidebarProps) => {
  // Используем состояние из контекста
  const state = useAppState();
  const {
    classes,
    currentLesson,
    currentGroup,
    currentClass,
    loading,
    groupLessons
  } = state;

  // Формируем selectedGroup для совместимости с существующими компонентами
  const selectedGroup: SelectedGroup | null = currentClass && currentGroup ? {
    classId: currentClass.id,
    className: currentClass.name,
    groupId: currentGroup.id,
    groupName: currentGroup.name,
  } : null;

  const handleOpenSettings = async () => {
    try {
      await window.electronAPI.openSettingsWindow();
    } catch (error) {
      console.error('Ошибка открытия окна настроек:', error);
    }
  }

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        {/* Контент сайдбара */}
        <div className="flex-1 overflow-y-auto">
          {!selectedGroup ? (
              <GroupSelector
                appData={classes}
                loading={loading}
                onGroupSelect={onGroupSelect}
              />
          ) : (
            currentLesson && (
              <StudentJournal
                selectedGroup={selectedGroup}
                currentLesson={currentLesson}
                allLessons={groupLessons}
                getStudentName={getStudentName}
                onBack={onBackToGroups}
                onLessonChange={onLessonChange}
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
          onClick={() => handleOpenSettings()}
          className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          title="Настройки"
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

    </>
  );
};

export default Sidebar;