// src/render/components/RandomizerTab/GroupCard.tsx
import { Shuffle } from 'lucide-react';
import { GroupScoreControl } from './GroupScoreControl';

interface GroupCardProps {
  groupIndex: number;
  students: string[];
  selectedStudent: string | null;
  score: number;
  isRandomizing: boolean;
  isCurrentGroup: boolean;
  onRandomize: (groupIndex: number) => void;
  onScoreChange: (change: number) => void;
  onScoreSet: (value: string) => void;
}

export const GroupCard = ({
                            groupIndex,
                            students,
                            selectedStudent,
                            score,
                            isRandomizing,
                            isCurrentGroup,
                            onRandomize,
                            onScoreChange,
                            onScoreSet,
                          }: GroupCardProps) => {
  return (
    <div className="bg-purple-50 p-4 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-purple-800 flex items-center gap-2">
          Группа {groupIndex + 1}
          <span className="text-xs font-normal text-purple-600">
            ({students.length} чел.)
          </span>
        </h4>
        <button
          onClick={() => onRandomize(groupIndex)}
          disabled={isRandomizing || students.length === 0}
          className="p-1 rounded bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
          title="Выбрать из этой группы"
        >
          <Shuffle size={16} className={isRandomizing && isCurrentGroup ? 'animate-spin' : ''} />
        </button>
      </div>

      <GroupScoreControl
        score={score}
        onScoreChange={onScoreChange}
        onScoreSet={onScoreSet}
      />

      {students.map((student, idx) => (
        <div
          key={idx}
          className={`text-lg py-1 transition-all duration-300 ${
            selectedStudent === student
              ? 'text-green-600 font-bold scale-105'
              : 'text-gray-700'
          }`}
        >
          {student}
        </div>
      ))}
    </div>
  );
};