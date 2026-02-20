import React from 'react';
import { useLogStore } from '../store/logStore';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DistributionChart() {
  const logs = useLogStore(state => state.logs);
  const { language } = useSettingsStore();
  const t = (key) => getTranslation(language, key);

  // Group focus time by hour of the day (0-23)
  const hourlyData = new Array(24).fill(0);
  
  logs.forEach(log => {
    if (log.type === 'focus') {
      const date = new Date(log.date);
      const hour = date.getHours();
      hourlyData[hour] += log.duration / 60; // store in minutes
    }
  });

  const data = {
    labels: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    datasets: [
      {
        label: t('focusTime') + ' (' + t('minutes') + ')',
        data: hourlyData,
        backgroundColor: 'rgba(59, 130, 246, 0.7)', // Match blue theme
        borderRadius: 4,
        hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
      }
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: t('timeDistribution'),
        color: '#f8fafc',
        font: { size: 14 }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 0 }
      }
    }
  };

  return (
    <div className="chart-container glass-panel" style={{ height: '300px', padding: '16px', marginTop: '24px' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
