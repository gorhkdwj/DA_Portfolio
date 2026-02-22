import React from 'react';
import TimerDisplay from '../components/TimerDisplay';
import Controls from '../components/Controls';
import { useGlobalTimer } from '../context/TimerContext';
import './Timer.css';

export default function Timer() {
  const timerState = useGlobalTimer();

  return (
    <div className={`page-container ${timerState.phase}-mode`}>
      <header className="page-header" style={{ justifyContent: 'center' }}>
        <h2 className="app-title">FocusFlow</h2>
      </header>
      
      <main className="timer-main">
        <TimerDisplay 
          phase={timerState.phase}
          formattedTime={timerState.formattedTime}
          timeLeft={timerState.timeLeft}
          totalTimeInPhase={timerState.totalTimeInPhase}
        />
        <Controls 
          isActive={timerState.isActive}
          toggleTimer={timerState.toggleTimer}
          resetTimer={timerState.resetTimer}
          skipPhase={timerState.skipPhase}
        />
      </main>
    </div>
  );
}
