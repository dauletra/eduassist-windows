// src/render/store/useStore.ts

import { useState, useEffect, useRef } from 'react';
import { AppStore } from './AppStore';

/**
 * Хук для использования Store в React компонентах
 */
export function useStore(store: AppStore) {
  const [state, setState] = useState(() => store.getState());
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const unsubscribe = store.subscribe((newState) => {
      // Предотвратить лишние перерисовки
      if (stateRef.current !== newState) {
        setState(newState);
      }
    });

    return unsubscribe;
  }, [store]);

  return state;
}