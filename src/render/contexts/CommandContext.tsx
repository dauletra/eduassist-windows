import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { EnrichedLesson } from '../types';

/**
 * Интерфейс контекста команд
 */
interface CommandContextValue {
  classId?: string;
  groupId?: string;
  lessonId?: string;
  currentLesson: EnrichedLesson | null;
}

/**
 * React Context для глобального состояния команд
 */
const CommandContext = createContext<CommandContextValue | null>(null);

/**
 * Provider для CommandContext
 * Оборачивает приложение и предоставляет доступ к текущему состоянию
 */
interface CommandProviderProps {
  children: ReactNode;
  currentLesson: EnrichedLesson | null;
}

export function CommandProvider({ children, currentLesson }: CommandProviderProps) {
  const value: CommandContextValue = {
    classId: currentLesson?.classId,
    groupId: currentLesson?.groupId,
    lessonId: currentLesson?.id,
    currentLesson
  };

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
export function useCommandContext(): CommandContextValue {
  const context = useContext(CommandContext);

  if (context === null) {
    throw new Error('useCommandContext must be used within CommandProvider');
  }

  return context;
}