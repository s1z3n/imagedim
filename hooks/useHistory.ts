
import { useState, useCallback } from 'react';

export const useHistory = <T,>(initialState: T) => {
  const [index, setIndex] = useState(0);
  const [history, setHistory] = useState<T[]>([initialState]);

  const setState = (action: T | ((prev: T) => T), overwrite = false) => {
    const newState = typeof action === 'function' ? (action as (prev: T) => T)(history[index]) : action;
    if (overwrite) {
      const historyCopy = [...history];
      historyCopy[index] = newState;
      setHistory(historyCopy);
    } else {
      const updatedHistory = history.slice(0, index + 1);
      setHistory([...updatedHistory, newState]);
      setIndex(updatedHistory.length);
    }
  };
  
  const undo = useCallback(() => {
    if (index > 0) {
      setIndex(prev => prev - 1);
    }
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) {
      setIndex(prev => prev + 1);
    }
  }, [index, history.length]);

  return {
    state: history[index],
    setState,
    undo,
    redo,
    canUndo: index > 0,
    canRedo: index < history.length - 1,
  };
};
