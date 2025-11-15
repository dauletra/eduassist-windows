// src/render/contexts/StoreContext.tsx

import { createContext, useContext, useMemo } from 'react';
import type { ReactNode } from 'react';
import { AppStore, useStore } from '../store';
import { CommandDispatcher } from '../services/commands';

/**
 * Единый React Context который заменяет все предыдущие контексты
 */
interface StoreContextValue {
  store: AppStore;
  commandDispatcher: CommandDispatcher;
}

const StoreContext = createContext<StoreContextValue | null>(null);

/**
 * Provider для единого StoreContext
 */
interface StoreProviderProps {
  children: ReactNode;
  store?: AppStore; // Опционально для тестирования
}

export function StoreProvider({ children, store }: StoreProviderProps) {
  // Создаем Store если не передан извне
  const appStore = useMemo(() => {
    return store || new AppStore();
  }, [store]);

  // Создаем CommandDispatcher
  const commandDispatcher = useMemo(() => {
    console.log('🏗️ Creating CommandDispatcher');
    return new CommandDispatcher(appStore);
  }, [appStore]);

  const value: StoreContextValue = useMemo(() => ({
    store: appStore,
    commandDispatcher
  }), [appStore, commandDispatcher]);

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Хук для получения Store
 */
export function useAppStore(): AppStore {
  const ctx = useContext(StoreContext);

  if (ctx === null) {
    throw new Error('useAppStore must be used within StoreProvider');
  }

  return ctx.store;
}

/**
 * Хук для получения CommandDispatcher
 */
export function useCommandDispatcher(): CommandDispatcher {
  const ctx = useContext(StoreContext);

  if (ctx === null) {
    throw new Error('useCommandDispatcher must be used within StoreProvider');
  }

  return ctx.commandDispatcher;
}

/**
 * Хук для использования состояния Store в компонентах
 */
export function useAppState() {
  const store = useAppStore();
  return useStore(store);
}

/**
 * Хук для получения DialogContext (для обратной совместимости)
 */
export function useDialogContext() {
  const store = useAppStore();
  return store.getDialogContext();
}