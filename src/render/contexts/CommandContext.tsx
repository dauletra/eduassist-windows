// src/render/contexts/CommandContext.tsx

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { DialogContext } from '../services/commands';
import { FinalCommandDispatcher } from '../services/commands/FinalCommandDispatcher'; // ИЗМЕНЕНО
import { AppStore, useStore } from '../store';

/**
 * React Context для глобального состояния команд
 */
interface CommandContextValue {
  context: DialogContext;
  commandDispatcher: FinalCommandDispatcher; // ИЗМЕНЕНО
  store: AppStore;
}

const CommandContext = createContext<CommandContextValue | null>(null);

/**
 * Provider для CommandContext
 * Теперь использует FinalCommandDispatcher без старой системы
 */
interface CommandProviderProps {
  children: ReactNode;
  store: AppStore;
}

export function CommandProvider({
                                  children,
                                  store
                                }: CommandProviderProps) {
  // Создать FinalCommandDispatcher (без EventProcessor)
  const commandDispatcher = useMemo(() => {
    console.log('🏗️ Creating FinalCommandDispatcher');
    return new FinalCommandDispatcher(store);
  }, [store]);

  // Получить DialogContext из Store
  const context = store.getDialogContext();

  const value: CommandContextValue = useMemo(() => ({
    context,
    commandDispatcher,
    store
  }), [context, commandDispatcher, store]);

  return (
    <CommandContext.Provider value={value}>
      {children}
    </CommandContext.Provider>
  );
}

/**
 * Хук для получения контекста команд
 */
export function useCommandContext(): DialogContext {
  const ctx = useContext(CommandContext);

  if (ctx === null) {
    throw new Error('useCommandContext must be used within CommandProvider');
  }

  return ctx.context;
}

/**
 * Хук для получения FinalCommandDispatcher
 */
export function useCommandDispatcher(): FinalCommandDispatcher {
  const ctx = useContext(CommandContext);

  if (ctx === null) {
    throw new Error('useCommandDispatcher must be used within CommandProvider');
  }

  return ctx.commandDispatcher;
}

/**
 * Хук для получения Store
 */
export function useAppStore(): AppStore {
  const ctx = useContext(CommandContext);

  if (ctx === null) {
    throw new Error('useAppStore must be used within CommandProvider');
  }

  return ctx.store;
}

/**
 * Хук для использования состояния Store в компонентах
 */
export function useAppState() {
  const store = useAppStore();
  return useStore(store);
}

// Убраны обратно-совместимые экспорты