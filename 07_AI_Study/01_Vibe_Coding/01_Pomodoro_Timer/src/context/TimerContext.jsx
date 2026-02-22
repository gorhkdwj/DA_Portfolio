import React, { createContext, useContext } from 'react';
import { useTimer } from '../hooks/useTimer';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const timerState = useTimer();
  return (
    <TimerContext.Provider value={timerState}>
      {children}
    </TimerContext.Provider>
  );
}

export function useGlobalTimer() {
  const context = useContext(TimerContext);
  if (!context) throw new Error("useGlobalTimer must be used within a TimerProvider");
  return context;
}
