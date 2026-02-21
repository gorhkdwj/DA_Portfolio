import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import './TimerDisplay.css';

export default function TimerDisplay({ phase, formattedTime, timeLeft, totalTimeInPhase }) {
  const { language, designTheme } = useSettingsStore();
  const t = (key) => getTranslation(language, key);

  const radius = 130;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  
  const strokeDashoffset = circumference - (timeLeft / totalTimeInPhase) * circumference;
  
  const isFocus = phase === 'focus';
  const isLongBreak = phase === 'longBreak';

  const getPhaseText = () => {
    if (isFocus) return t('focusTime');
    if (isLongBreak) return t('longBreakTime');
    return t('breakTime');
  };

  const getStrokeColor = () => {
    if (designTheme === 'cyberpunk') return 'url(#cyberpunkGradient)';
    if (isFocus) return 'url(#focusGradient)';
    if (isLongBreak) return 'url(#longBreakGradient)';
    return 'url(#breakGradient)';
  };

  return (
    <div className={`timer-display-container ${phase}-mode`}>
      <div className="timer-circle-wrapper">
        <svg
          height={radius * 2}
          width={radius * 2}
          className="timer-svg"
        >
          <defs>
            <linearGradient id="focusGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffb6b9" />
              <stop offset="100%" stopColor="#ff7b89" />
            </linearGradient>
            <linearGradient id="breakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#b5ead7" />
              <stop offset="100%" stopColor="#55d8a8" />
            </linearGradient>
            <linearGradient id="longBreakGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a0c4ff" />
              <stop offset="100%" stopColor="#73a2ff" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            
            <linearGradient id="cyberpunkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />  {/* Cyan */}
              <stop offset="100%" stopColor="#a855f7" /> {/* Purple */}
            </linearGradient>
            <filter id="cyberpunkGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <circle
            cx={radius} cy={radius} r={radius - 2} 
            stroke={designTheme === 'cyberpunk' ? "rgba(255, 255, 255, 0.05)" : "rgba(255,255,255,0.03)"} 
            strokeWidth={designTheme === 'cyberpunk' ? "4" : "3"} 
            strokeDasharray={designTheme === 'cyberpunk' ? "none" : "8 8"} 
            fill="none" 
            transform="rotate(90 130 130)"
          />

          <circle
            className="timer-track"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            className="timer-progress"
            stroke={getStrokeColor()}
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            filter={designTheme === 'cyberpunk' ? "url(#cyberpunkGlow)" : "url(#glow)"}
          />
        </svg>
        <div className="timer-text-container">
          <h1 className="timer-time">{formattedTime}</h1>
          <span className="timer-phase">{getPhaseText()}</span>
        </div>
      </div>
    </div>
  );
}
