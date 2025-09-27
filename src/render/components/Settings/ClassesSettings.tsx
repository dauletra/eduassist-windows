import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users } from 'lucide-react';
import type { Class } from '../../types';

interface ClassesSettingsProps {
  onUpdate: () => void;
}

const ClassesSettings = ({ onUpdate }: ClassesSettingsProps) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newGroups, setNewGroups] = useState<string[]>(['']);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const data = await window.settings.loadStudentsList();
      setClasses(data);
    } catch (error) {
      console.error('Ошибка загрузки классов:', error);
    }
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;

    const validGroups = newGroups.filter(g => g.trim());
    if (validGroups.length === 0) return;

    try {
      await window.settings.addClassWithGroups(newClassName.trim(), validGroups);
      await loadClasses();
      onUpdate();
      setIsAdding(false);
      setNewClassName('');
      setNewGroups(['']);
    } catch (error) {
      console.error('Ошибка добавления класса:', error);
    }
  };

  const handleDeleteClass = async (classId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот класс?')) return;

    try {
      await window.settings.deleteClass(classId);
      await loadClasses();
      onUpdate();
    } catch (error) {
      console.error('Ошибка удаления класса:', error);
    }
  };

  const addGroupField = () => {
    setNewGroups([...newGroups, '']);
  };

  const updateGroupField = (index: number, value: string) => {
    const updated = [...newGroups];
    updated[index] = value;
    setNewGroups(updated);
  };

  const removeGroupField = (index: number) => {
    if (newGroups.length > 1) {
      setNewGroups(newGroups.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-6">
    <div className="flex items-center justify-between">
    <h3 className="text-lg font-medium text-gray-800">Управление классами</h3>
  <button
  onClick={() => setIsAdding(true)}
  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
  >
  <Plus className="w-4 h-4" />
    Добавить класс
  </button>
  </div>

  {/* Форма добавления класса */}
  {isAdding && (
    <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
      Название класса
  </label>
  <input
    type="text"
    value={newClassName}
    onChange={(e) => setNewClassName(e.target.value)}
    placeholder="Например: 10А"
    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    </div>

    <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">
      Группы
      </label>
      <div className="space-y-2">
    {newGroups.map((group, index) => (
        <div key={index} className="flex gap-2">
      <input
        type="text"
      value={group}
      onChange={(e) => updateGroupField(index, e.target.value)}
    placeholder={`Группа ${index + 1}`}
    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {newGroups.length > 1 && (
          <button
            onClick={() => removeGroupField(index)}
    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
    >
    <Trash2 className="w-5 h-5" />
      </button>
  )}
    </div>
  ))}
    </div>
    <button
    onClick={addGroupField}
    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
      >
      + Добавить группу
  </button>
  </div>

  <div className="flex gap-2 justify-end">
  <button
    onClick={() => {
    setIsAdding(false);
    setNewClassName('');
    setNewGroups(['']);
  }}
    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
      Отмена
      </button>
      <button
    onClick={handleAddClass}
    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
      >
      Сохранить
      </button>
      </div>
      </div>
  )}

  {/* Список классов */}
  <div className="space-y-3">
    {classes.map((cls) => (
        <div key={cls.id} className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center justify-between mb-3">
      <h4 className="text-base font-medium text-gray-800">{cls.name}</h4>
        <div className="flex gap-2">
      <button
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      title="Редактировать"
      >
      <Edit2 className="w-4 h-4" />
        </button>
        <button
      onClick={() => handleDeleteClass(cls.id)}
  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
  title="Удалить"
  >
  <Trash2 className="w-4 h-4" />
    </button>
    </div>
    </div>
    <div className="flex items-center gap-4 text-sm text-gray-600">
  <div className="flex items-center gap-1">
  <Users className="w-4 h-4" />
    <span>{cls.groups.length} групп(ы)</span>
  </div>
  <div className="text-gray-400">•</div>
  <div>
  {cls.groups.map(g => g.name).join(', ')}
  </div>
  </div>
  </div>
))}

  {classes.length === 0 && !isAdding && (
    <div className="text-center py-12 text-gray-500">
      Нет добавленных классов. Нажмите "Добавить класс" для создания.
  </div>
  )}
  </div>
  </div>
);
};

export default ClassesSettings;