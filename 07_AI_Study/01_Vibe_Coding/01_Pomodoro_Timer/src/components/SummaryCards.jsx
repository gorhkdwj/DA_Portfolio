import React from 'react';
import { useLogStore } from '../store/logStore';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import { Flame, Clock, Coffee } from 'lucide-react';
import './SummaryCards.css';

export default function SummaryCards() {
  const { logs, currentStreak } = useLogStore();
  const { language } = useSettingsStore();
  const t = (key) => getTranslation(language, key);

  const totalFocusTime = logs
    .filter(l => l.type === 'focus')
    .reduce((acc, l) => acc + l.duration, 0) / 3600;

  const totalBreakTime = logs
    .filter(l => l.type === 'break')
    .reduce((acc, l) => acc + l.duration, 0) / 3600;

  return (
    <div className="summary-cards-container">
      <div className="summary-card glass-panel streak-card">
        <Flame size={32} color="#ef4444" />
        <div className="card-info">
          <h3>{currentStreak} {t('days')}</h3>
          <span>{t('currentStreak')}</span>
        </div>
      </div>
      
      <div className="summary-card glass-panel focus-card">
        <Clock size={32} color="#3b82f6" />
        <div className="card-info">
          <h3>{totalFocusTime.toFixed(1)}h</h3>
          <span>{t('totalFocus')}</span>
        </div>
      </div>
      
      <div className="summary-card glass-panel break-card">
        <Coffee size={32} color="#10b981" />
        <div className="card-info">
          <h3>{totalBreakTime.toFixed(1)}h</h3>
          <span>{t('totalBreak')}</span>
        </div>
      </div>
    </div>
  );
}
