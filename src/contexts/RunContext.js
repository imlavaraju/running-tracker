/**
 * Running Tracker — Run Data Context
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loadRuns, saveRuns } from '../utils/storage';

const RunContext = createContext();

export function RunProvider({ children }) {
  const [runs, setRuns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await loadRuns();
      setRuns(saved.sort((a, b) => new Date(b.startTime) - new Date(a.startTime)));
      setIsLoading(false);
    })();
  }, []);

  const addRun = useCallback(async (runData) => {
    const newRun = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2),
      ...runData,
    };
    setRuns((prev) => {
      const updated = [newRun, ...prev];
      saveRuns(updated);
      return updated;
    });
    return newRun;
  }, []);

  const deleteRun = useCallback(async (id) => {
    setRuns((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRuns(updated);
      return updated;
    });
  }, []);

  const getRun = useCallback(
    (id) => {
      return runs.find((r) => r.id === id) || null;
    },
    [runs],
  );

  return (
    <RunContext.Provider value={{ runs, addRun, deleteRun, getRun, isLoading }}>
      {children}
    </RunContext.Provider>
  );
}

export function useRuns() {
  const context = useContext(RunContext);
  if (!context) throw new Error('useRuns must be used within RunProvider');
  return context;
}

