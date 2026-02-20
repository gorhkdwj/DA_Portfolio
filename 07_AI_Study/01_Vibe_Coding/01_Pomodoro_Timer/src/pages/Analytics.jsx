import React from 'react';
import SummaryCards from '../components/SummaryCards';
import DistributionChart from '../components/DistributionChart';
import TrendChart from '../components/TrendChart';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import './Analytics.css';

export default function Analytics() {
  const { language } = useSettingsStore();
  const t = (key) => getTranslation(language, key);

  return (
    <div className="page-container analytics-page">
      <header className="page-header">
        <h2 className="app-title">{t('analytics')}</h2>
      </header>
      
      <main className="analytics-main">
        <SummaryCards />
        <DistributionChart />
        <TrendChart />
      </main>
    </div>
  );
}
