import React, { useState, useMemo } from 'react';
import { useLogStore } from '../store/logStore';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import { Line } from 'react-chartjs-2';
import { format, subDays, isSameDay, startOfWeek, isSameWeek, startOfMonth, isSameMonth, subWeeks, subMonths } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import './TrendChart.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TrendChart() {
  const logs = useLogStore(state => state.logs);
  const { language } = useSettingsStore();
  const t = (key) => getTranslation(language, key);
  
  const [viewMode, setViewMode] = useState('daily'); // 'daily' | 'weekly' | 'monthly'

  const { labels, dataPoints } = useMemo(() => {
    const focusLogs = logs.filter(l => l.type === 'focus');
    const today = new Date();
    
    let labels = [];
    let dataPoints = [];

    if (viewMode === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = subDays(today, i);
        labels.push(format(d, 'EEE'));
        const dayLogs = focusLogs.filter(l => isSameDay(new Date(l.date), d));
        const totalMin = dayLogs.reduce((acc, l) => acc + l.duration, 0) / 60;
        dataPoints.push(totalMin);
      }
    } else if (viewMode === 'weekly') {
      for (let i = 3; i >= 0; i--) {
        const d = subWeeks(today, i);
        labels.push(`Week ${format(d, 'w')}`);
        const weekLogs = focusLogs.filter(l => isSameWeek(new Date(l.date), d, { weekStartsOn: 1 }));
        const totalHour = weekLogs.reduce((acc, l) => acc + l.duration, 0) / 3600;
        dataPoints.push(totalHour);
      }
    } else if (viewMode === 'monthly') {
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(today, i);
        labels.push(format(d, 'MMM'));
        const monthLogs = focusLogs.filter(l => isSameMonth(new Date(l.date), d));
        const totalHour = monthLogs.reduce((acc, l) => acc + l.duration, 0) / 3600;
        dataPoints.push(totalHour);
      }
    }
    
    return { labels, dataPoints };
  }, [logs, viewMode]);

  const unit = viewMode === 'daily' ? t('minutes') : t('hours');

  const data = {
    labels,
    datasets: [
      {
        label: `${t('focusTime')} (${unit})`,
        data: dataPoints,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3b82f6',
        pointRadius: 4,
        pointHoverRadius: 6,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8' }
      }
    }
  };

  return (
    <div className="chart-container glass-panel trend-chart-container">
      <div className="trend-header">
        <h3>{t('focusTrends')}</h3>
        <div className="trend-controls">
          <button className={viewMode === 'daily' ? 'active' : ''} onClick={() => setViewMode('daily')}>D</button>
          <button className={viewMode === 'weekly' ? 'active' : ''} onClick={() => setViewMode('weekly')}>W</button>
          <button className={viewMode === 'monthly' ? 'active' : ''} onClick={() => setViewMode('monthly')}>M</button>
        </div>
      </div>
      <div className="chart-wrapper">
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
