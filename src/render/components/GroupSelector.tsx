// import { useState } from 'react';
// import { ChevronRight } from 'lucide-react';
import type { Class } from '../types';

interface GroupSelectorProps {
  appData: Class[] | null;
  loading: boolean;
  onGroupSelect: (groupId: string) => void;
}

const GroupSelector = ({ appData, loading, onGroupSelect }: GroupSelectorProps) => {
  // const [expandedClasses, setExpandedClasses] = useState<string[]>([]);

  /*
  const toggleClass = (classId: string) => {
    setExpandedClasses(prev => 
      prev.includes(classId) 
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };
  */

  if (!appData) {
    return (
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-700">ЖУРНАЛЫ</h2>
          {loading && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
          )}
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Загрузка классов...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-700">ЖУРНАЛЫ</h2>
        {loading && (
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-500 border-t-transparent" />
        )}
      </div>

      <div className="space-y-2">
        {appData.map(cls => (
          <div key={cls.id} className="mb-2">

            <div 
              className="bg-gray-100 p-3 rounded-lg ">
              <div className="flex items-center justify-between">
                <span className="text-gray-700">{cls.name}</span>

              </div>
            </div>

            <div className="ml-4 mt-2 space-y-1">
              {cls.groups.map(group => (
                <div
                  key={group.id}
                  className="py-2 px-2 cursor-pointer rounded transition-all text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  onClick={() => onGroupSelect(group.id)}
                >
                  <div className="flex justify-between items-center">
                    <span>{group.name}</span>
                    <span className="text-xs opacity-60">({group.students.length})</span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupSelector;