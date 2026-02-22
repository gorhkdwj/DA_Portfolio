import { useState, useEffect, useRef, useCallback } from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { useLogStore } from '../store/logStore';
import { playBeep } from '../utils/sound';

export function useTimer() {
  const { focusTime, breakTime, longBreakTime, longBreakInterval, autoStartBreaks, autoStartPoms, focusSound, breakSound, focusVolume, breakVolume } = useSettingsStore();
  const addLog = useLogStore(state => state.addLog);

  const [phase, setPhase] = useState('focus'); // 'focus' | 'break' | 'longBreak'
  const [timeLeft, setTimeLeft] = useState(focusTime * 60);
  const [isActive, setIsActive] = useState(false);
  const [pomodorosSinceLongBreak, setPomodorosSinceLongBreak] = useState(0);
  
  const timerRef = useRef(null);

  const prevSettings = useRef({ focusTime, breakTime, longBreakTime, phase });

  // Sync initial time if settings change while inactive
  useEffect(() => {
    const settingsChanged = 
      prevSettings.current.focusTime !== focusTime ||
      prevSettings.current.breakTime !== breakTime ||
      prevSettings.current.longBreakTime !== longBreakTime ||
      prevSettings.current.phase !== phase;

    if (settingsChanged) {
      if (!isActive) {
        setTimeLeft(phase === 'focus' ? focusTime * 60 : (phase === 'longBreak' ? longBreakTime * 60 : breakTime * 60));
      }
      prevSettings.current = { focusTime, breakTime, longBreakTime, phase };
    }
  }, [focusTime, breakTime, longBreakTime, phase, isActive]);

  const endPhase = useCallback(() => {
    setIsActive(false);
    
    let nextPhase;
    let currentPomCount = pomodorosSinceLongBreak;

    if (phase === 'focus') {
      currentPomCount++;
      setPomodorosSinceLongBreak(currentPomCount);
      if (longBreakInterval > 0 && currentPomCount >= longBreakInterval) {
        nextPhase = 'longBreak';
        setPomodorosSinceLongBreak(0);
      } else {
        nextPhase = 'break';
      }
    } else {
      nextPhase = 'focus';
    }

    playBeep(nextPhase === 'focus' ? focusSound : breakSound, nextPhase === 'focus' ? focusVolume : breakVolume);
    
    // Log the session
    const durationMins = phase === 'focus' ? focusTime : (phase === 'longBreak' ? longBreakTime : breakTime);
    addLog({
      date: new Date().toISOString(),
      type: phase,
      duration: durationMins * 60
    });

    setPhase(nextPhase);
    setTimeLeft(nextPhase === 'focus' ? focusTime * 60 : (nextPhase === 'longBreak' ? longBreakTime * 60 : breakTime * 60));

    // Check auto-start settings
    if ((nextPhase === 'break' && autoStartBreaks) || 
        (nextPhase === 'longBreak' && autoStartBreaks) ||
        (nextPhase === 'focus' && autoStartPoms) ||
        phase === 'longBreak') {
      setIsActive(true);
    }
  }, [phase, pomodorosSinceLongBreak, focusTime, breakTime, longBreakTime, longBreakInterval, autoStartBreaks, autoStartPoms, focusSound, breakSound, focusVolume, breakVolume, addLog]);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      endPhase();
    }

    return () => clearInterval(timerRef.current);
  }, [isActive, timeLeft, endPhase]);

  const toggleTimer = () => setIsActive((prev) => !prev);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(phase === 'focus' ? focusTime * 60 : (phase === 'longBreak' ? longBreakTime * 60 : breakTime * 60));
  };

  const skipPhase = () => {
    setIsActive(false);
    let nextPhase;
    let currentPomCount = pomodorosSinceLongBreak;

    if (phase === 'focus') {
      currentPomCount++;
      setPomodorosSinceLongBreak(currentPomCount);
      if (longBreakInterval > 0 && currentPomCount >= longBreakInterval) {
        nextPhase = 'longBreak';
        setPomodorosSinceLongBreak(0);
      } else {
        nextPhase = 'break';
      }
    } else {
      nextPhase = 'focus';
    }

    setPhase(nextPhase);
    setTimeLeft(nextPhase === 'focus' ? focusTime * 60 : (nextPhase === 'longBreak' ? longBreakTime * 60 : breakTime * 60));
  };

  useEffect(() => {
    const handleToggle = () => toggleTimer();
    const handleSwitchFocus = () => {
      setIsActive(false);
      setPhase('focus');
      setTimeLeft(focusTime * 60);
    };
    const handleSwitchBreak = () => {
      setIsActive(false);
      setPhase('break');
      setTimeLeft(breakTime * 60);
    };
    const handleSwitchLongBreak = () => {
      setIsActive(false);
      setPhase('longBreak');
      setTimeLeft(longBreakTime * 60);
    };

    window.addEventListener('timer-shortcut:toggle', handleToggle);
    window.addEventListener('timer-shortcut:switch-focus', handleSwitchFocus);
    window.addEventListener('timer-shortcut:switch-break', handleSwitchBreak);
    window.addEventListener('timer-shortcut:switch-longBreak', handleSwitchLongBreak);
    
    return () => {
      window.removeEventListener('timer-shortcut:toggle', handleToggle);
      window.removeEventListener('timer-shortcut:switch-focus', handleSwitchFocus);
      window.removeEventListener('timer-shortcut:switch-break', handleSwitchBreak);
      window.removeEventListener('timer-shortcut:switch-longBreak', handleSwitchLongBreak);
    };
  }, [focusTime, breakTime, longBreakTime]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return {
    phase,
    timeLeft,
    isActive,
    toggleTimer,
    resetTimer,
    skipPhase,
    formattedTime: formatTime(timeLeft),
    totalTimeInPhase: phase === 'focus' ? focusTime * 60 : (phase === 'longBreak' ? longBreakTime * 60 : breakTime * 60)
  };
}
