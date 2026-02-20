import React from 'react';
import { Play, Pause, Square, SkipForward } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import './Controls.css';

export default function Controls({ isActive, toggleTimer, resetTimer, skipPhase }) {
  const { language } = useSettingsStore();
  const t = (key) => getTranslation(language, key);

  return (
    <div className="controls-container">
      <button className="control-btn secondary" onClick={resetTimer} title={t('reset')}>
        <Square size={22} />
      </button>
      
      {/* Explicit Pause Button and Play Button merged conceptually but visually clearer */}
      <button 
        className={`control-btn primary ${isActive ? 'is-active' : ''}`} 
        onClick={toggleTimer} 
        title={isActive ? t('pause') : t('start')}
      >
        {isActive ? <Pause size={34} /> : <Play size={34} style={{ marginLeft: '4px' }} />}
      </button>
      
      <button className="control-btn secondary" onClick={skipPhase} title={t('skip')}>
        <SkipForward size={22} />
      </button>
    </div>
  );
}
