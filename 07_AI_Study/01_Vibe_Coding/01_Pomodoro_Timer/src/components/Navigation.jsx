import React from 'react';
import { NavLink } from 'react-router-dom';
import { Timer as TimerIcon, BarChart2, Settings } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import './Navigation.css';

export default function Navigation({ onOpenSettings }) {
  const { language } = useSettingsStore();
  const t = (key) => getTranslation(language, key);

  return (
    <nav className="glass-panel main-nav">
      <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <TimerIcon size={24} />
        <span>{t('timer')}</span>
      </NavLink>
      <NavLink to="/analytics" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
        <BarChart2 size={24} />
        <span>{t('analytics')}</span>
      </NavLink>
      <button className="nav-item settings-nav-btn" onClick={onOpenSettings}>
        <Settings size={24} />
        <span>{t('settings')}</span>
      </button>
    </nav>
  );
}
