import { Plus, Minus } from 'lucide-react';

interface GroupScoreControlProps {
  score: number;
  onScoreChange: (change: number) => void;
  onScoreSet: (value: string) => void;
}

export const GroupScoreControl = ({ score, onScoreChange, onScoreSet }: GroupScoreControlProps) => {
  return (
    <div className="mb-3 p-2 bg-white rounded-lg border-2 border-purple-200">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-purple-700">Баллы:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onScoreChange(-1)}
            className="p-1 rounded bg-orange-500 text-white hover:bg-orange-600 transition-colors"
          >
            <Minus size={14} />
          </button>
          <input
            type="number"
            value={score}
            onChange={(e) => onScoreSet(e.target.value)}
            className="w-16 text-center border border-purple-300 rounded px-1 py-0.5 text-lg font-bold text-purple-800"
            min="0"
          />
          <button
            onClick={() => onScoreChange(1)}
            className="p-1 rounded bg-green-500 text-white hover:bg-green-600 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};