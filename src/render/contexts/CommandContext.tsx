import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {EnrichedLesson, SelectedGroup} from '../types';
import type { DialogContext } from '../services/commands';
import { CommandExecutor } from '../services/commands/CommandExecutor';
import { EventProcessor } from '../services/commands/EventProcessor';

/**
 * React Context для глобального состояния команд
 */
interface CommandContextValue {
  context: DialogContext;
  commandExecutor: CommandExecutor;
}

const CommandContext = createContext<CommandContextValue | null>(null);

/**
 * Provider для CommandContext
 * Создаёт единственный экземпляр CommandExecutor с EventProcessor
 */
interface CommandProviderProps {
  children: ReactNode;
  currentLesson: EnrichedLesson | null;
  selectedGroup: SelectedGroup | null;
  setCurrentLesson: (updater: (prev: EnrichedLesson | null) => EnrichedLesson | null) => void;
}

export function CommandProvider({
                                  children,
                                  currentLesson,
                                  selectedGroup,
                                  setCurrentLesson
                                }: CommandProviderProps) {
  // Внутреннее состояние контекста (может быть изменено командами)
  const [contextState, setContextState] = useState<DialogContext>({currentLesson: null});

  // Объединённый контекст: props + состояние от команд
  const context: DialogContext = useMemo(() => ({
    classId: contextState.classId ?? selectedGroup?.classId,
    groupId: contextState.groupId ?? selectedGroup?.groupId,
    lessonId: contextState.lessonId ?? currentLesson?.id,
    currentLesson,
    hasConflict: contextState.hasConflict
  }), [contextState, selectedGroup, currentLesson]);

  // Создать EventProcessor и CommandExecutor
  const commandExecutor = useMemo(() => {
    console.log('🏗️ Creating CommandExecutor with EventProcessor');

    // EventProcessor обновляет React состояние
    const eventProcessor = new EventProcessor(
      (updater) => setContextState(updater),
      (updater) => setCurrentLesson(updater)
    );

    // Создаём ссылки которые можно обновлять
    const contextRef = { current: context };
    const lessonRef = { current: currentLesson };

    // CommandExecutor получает контекст через callback из ref
    const executor = new CommandExecutor(
      () => contextRef.current,
      () => lessonRef.current,
      eventProcessor
    );

    // Сохраняем ссылки для обновления
    (executor as any).contextRef = contextRef;
    (executor as any).lessonRef = lessonRef;

    return executor;
  }, [context, currentLesson, setCurrentLesson]); // setCurrentLesson стабилен

  // Обновляем ссылки на актуальные значения при каждом рендере
  (commandExecutor as any).contextRef.current = context;
  (commandExecutor as any).lessonRef.current = currentLesson;

  const value: CommandContextValue = useMemo(() => ({
    context,
    commandExecutor
  }), [context, commandExecutor]);

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
}

/**
 * Хук для получения контекста команд
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCommandContext(): DialogContext {
  const ctx = useContext(CommandContext);

  if (ctx === null) {
    throw new Error('useCommandContext must be used within CommandProvider');
  }

  return ctx.context;
}

/**
 * Хук для получения CommandExecutor
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useCommandExecutor(): CommandExecutor {
  const ctx = useContext(CommandContext);

  if (ctx === null) {
    throw new Error('useCommandExecutor must be used within CommandProvider');
  }

  return ctx.commandExecutor;
}