// src/render/components/RandomizerTab/RandomizerSettings.tsx
import { Plus, Minus } from 'lucide-react';

interface RandomizerSettingsProps {
  includeAbsent: boolean;
  divisionMode: 'groups' | 'people';
  groupCount: number;
  peoplePerGroup: number;
  groupStats: {
    min: number;
    max: number;
    studentsPerGroup: number;
    remainder: number;
    actualGroupCount: number;
  };
  onIncludeAbsentChange: (value: boolean) => void;
  onDivisionModeChange: (mode: 'groups' | 'people') => void;
  onCountChange: (newCount: number) => void;
}

export const RandomizerSettings = ({
                                     includeAbsent,
                                     divisionMode,
                                     groupCount,
                                     peoplePerGroup,
                                     groupStats,
                                     onIncludeAbsentChange,
                                     onDivisionModeChange,
                                     onCountChange,
                                   }: RandomizerSettingsProps) => {
  const currentCount = divisionMode === 'groups' ? groupCount : peoplePerGroup;

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-3 text-gray-700">Настройки групп</h4>

      <div className="flex items-center gap-3 mb-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={includeAbsent}
            onChange={(e) => onIncludeAbsentChange(e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">
            Включать отсутствующих в рандомайзер
          </span>
        </label>
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-600 block mb-2">Режим разделения:</span>
        <div className="flex gap-2">
          <button
            onClick={() => onDivisionModeChange('groups')}
            className={`px-3 py-2 text-sm rounded transition-colors ${
              divisionMode === 'groups'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            На количество групп
          </button>
          <button
            onClick={() => onDivisionModeChange('people')}
            className={`px-3 py-2 text-sm rounded transition-colors ${
              divisionMode === 'people'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            По количеству человек
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {divisionMode === 'groups' ? 'Количество групп:' : 'Человек в группе:'}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onCountChange(currentCount - 1)}
            disabled={currentCount <= groupStats.min}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="w-8 text-center font-medium">{currentCount}</span>
          <button
            onClick={() => onCountChange(currentCount + 1)}
            disabled={currentCount >= groupStats.max}
            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <span className="text-xs text-gray-500">
          {divisionMode === 'groups'
            ? `По ${groupStats.studentsPerGroup}${groupStats.remainder > 0 ? `-${groupStats.studentsPerGroup + 1}` : ''} человек в группе`
            : `Получится ${groupStats.actualGroupCount} ${groupStats.actualGroupCount === 1 ? 'группа' : groupStats.actualGroupCount < 5 ? 'группы' : 'групп'}`
          }
        </span>
      </div>
    </div>
  );
};