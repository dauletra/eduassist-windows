import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {EnrichedLesson, SelectedGroup} from '../types';
import type { DialogContext } from '../services/commands';
import { commandEventBus } from '../services/CommandEventBus';

/**
 * React Context для глобального состояния команд
 */
const CommandContext = createContext<DialogContext | null>(null);

/**
 * Provider для CommandContext
 * Оборачивает приложение и предоставляет доступ к текущему состоянию
 */
interface CommandProviderProps {
  children: ReactNode;
  currentLesson: EnrichedLesson | null;
  selectedGroup: SelectedGroup | null;
}

export function CommandProvider({ children, currentLesson, selectedGroup }: CommandProviderProps) {
  const value: DialogContext = useMemo(() =>({
    classId: selectedGroup?.classId,
    groupId: selectedGroup?.groupId,
    lessonId: currentLesson?.id,
    currentLesson
  }), [selectedGroup, currentLesson]);

  const [, setContextOverride] = useState<Partial<DialogContext> | null>(null);

  useEffect(() => {
    const unsubscribe = commandEventBus.subscribe('context_changed', (updates) => {
      setContextOverride(prev => ({
        ...prev,
        ...updates  // Просто мержим любые обновления
      }));
    });
    return unsubscribe;
  }, []);

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
}

/**
 * Хук для получения контекста команд
 * Выбрасывает ошибку если используется вне Provider
 */
export function useCommandContext(): DialogContext {
  const context = useContext(CommandContext);

  if (context === null) {
    throw new Error('useCommandContext must be used within CommandProvider');
  }

  return context;
}