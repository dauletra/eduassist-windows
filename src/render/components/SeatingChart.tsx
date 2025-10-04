// src/render/components/SeatingChart.tsx
import { useState } from 'react';
import { Shuffle, Users } from 'lucide-react';
import type { SelectedGroup, Lesson, Group } from '../types';

interface SeatingChartProps {
  selectedGroup: SelectedGroup;
  currentLesson: Lesson | null;
  groupData: Group | null;
}

interface ClassroomLayout {
  rows: number;
  desksPerRow: number[];
}

// Дефолтная схема класса
const DEFAULT_LAYOUT: ClassroomLayout = {
  rows: 3,
  desksPerRow: [5, 5, 2]
};

export const SeatingChart = ({ currentLesson, groupData }: SeatingChartProps) => {
  const [layout, setLayout] = useState<ClassroomLayout>(DEFAULT_LAYOUT);
  const [seating, setSeating] = useState<(string | null)[][]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [animatingIndex, setAnimatingIndex] = useState<number>(-1);

  // Получаем присутствующих учеников
  const availableStudents = currentLesson && groupData
    ? groupData.students.filter(student => {
      const lessonStudent = currentLesson.students.find(ls => ls.id === student.id);
      return lessonStudent?.attendance !== false;
    })
    : [];

  const randomizeSeating = async () => {
    if (availableStudents.length === 0) return;

    const shuffled = [...availableStudents].sort(() => Math.random() - 0.5);
    const newSeating: (string | null)[][] = [];

    // Создаем пустую структуру
    for (let row = 0; row < layout.rows; row++) {
      newSeating.push(new Array(layout.desksPerRow[row]).fill(null));
    }

    setSeating(newSeating);

    // Анимированное заполнение
    let studentIndex = 0;
    const maxDesks = Math.max(...layout.desksPerRow);

    for (let desk = 0; desk < maxDesks && studentIndex < shuffled.length; desk++) {
      for (let row = 0; row < layout.rows && studentIndex < shuffled.length; row++) {
        if (desk < layout.desksPerRow[row]) {
          const currentStudent = shuffled[studentIndex];
          if (!currentStudent) break;

          setAnimatingIndex(studentIndex);

          await new Promise(resolve => setTimeout(resolve, 150));

          setSeating(prev => {
            const updated = prev.map(r => [...r]);
            updated[row][desk] = currentStudent.name;
            return updated;
          });

          studentIndex++;
        }
      }
    }

    setAnimatingIndex(-1);
  };

  const updateRow = (rowIndex: number, desksCount: number) => {
    const newDesksPerRow = [...layout.desksPerRow];
    newDesksPerRow[rowIndex] = Math.max(1, Math.min(8, desksCount));
    setLayout({ ...layout, desksPerRow: newDesksPerRow });
  };

  const addRow = () => {
    if (layout.rows >= 6) return;
    setLayout({
      rows: layout.rows + 1,
      desksPerRow: [...layout.desksPerRow, 4]
    });
  };

  const removeRow = (rowIndex: number) => {
    if (layout.rows <= 1) return;
    const newDesksPerRow = layout.desksPerRow.filter((_, i) => i !== rowIndex);
    setLayout({
      rows: layout.rows - 1,
      desksPerRow: newDesksPerRow
    });
  };

  if (!currentLesson) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Выберите группу для настройки рассадки</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Рассадка</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              isEditing
                ? 'bg-gray-600 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isEditing ? 'Готово' : 'Настроить схему'}
          </button>
          <button
            onClick={randomizeSeating}
            disabled={availableStudents.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Shuffle size={18} />
            Рассадить случайно
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-700">Схема кабинета</h3>
            <button
              onClick={addRow}
              disabled={layout.rows >= 6}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
            >
              + Добавить ряд
            </button>
          </div>
          <div className="space-y-2">
            {layout.desksPerRow.map((desks, index) => (
              <div key={index} className="flex items-center gap-3">
                <span className="text-gray-600 w-16">Ряд {index + 1}:</span>
                <input
                  type="number"
                  min="1"
                  max="8"
                  value={desks}
                  onChange={(e) => updateRow(index, parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-1 border border-gray-300 rounded"
                />
                <span className="text-gray-500 text-sm">
                  {desks} {desks === 1 ? 'парта' : desks < 5 ? 'парты' : 'парт'}
                </span>
                {layout.rows > 1 && (
                  <button
                    onClick={() => removeRow(index)}
                    className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                  >
                    Удалить
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 text-sm text-gray-600">
        Присутствует: {availableStudents.length} из {groupData?.students.length} учеников
      </div>

      <div className="flex gap-6 justify-center">
        {seating.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 w-full">
            <Users size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500">
              Нажмите "Рассадить случайно" чтобы распределить учеников
            </p>
          </div>
        ) : (
          <>
            {/* Номера парт слева */}
            <div className="flex flex-col gap-3">
              <span className="text-gray-500 font-medium text-center h-6"></span>
              {Array.from({ length: Math.max(...layout.desksPerRow) }).map((_, index) => (
                <div key={index} className="h-20 flex items-center justify-center text-gray-500 font-medium w-8">
                  {index + 1}
                </div>
              ))}
            </div>

            {/* Ряды с партами */}
            {seating.map((row, rowIndex) => (
              <div key={rowIndex} className="flex flex-col gap-3">
                <span className="text-gray-500 font-medium text-center">Ряд {rowIndex + 1}</span>
                <div className="flex flex-col gap-3">
                  {row.map((studentName, deskIndex) => (
                    <div
                      key={deskIndex}
                      className={`w-40 h-20 border-2 rounded-lg flex items-center justify-center transition-all duration-300 ${
                        studentName
                          ? 'bg-white border-blue-400 shadow-sm scale-100'
                          : 'bg-gray-50 border-gray-300 border-dashed scale-95'
                      } ${studentName && seating.flat().filter(Boolean).indexOf(studentName) === animatingIndex ? 'animate-pulse scale-110 border-green-500' : ''}`}
                    >
                      {studentName ? (
                        <span className="text-lg font-medium text-center px-2">
                    {studentName}
                  </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Пусто</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="min-h-20"></div>
    </div>
  );
};