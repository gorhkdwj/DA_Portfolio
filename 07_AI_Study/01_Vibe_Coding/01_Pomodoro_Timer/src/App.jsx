import { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Analytics as VercelAnalytics } from '@vercel/analytics/react';
import Timer from './pages/Timer';
import Analytics from './pages/Analytics';
import Navigation from './components/Navigation';
import SettingsModal from './components/SettingsModal';
import { useSettingsStore } from './store/settingsStore';
import { stopCurrentAlarm } from './utils/sound';
import { isElectron } from './utils/fsHelper';

function App() {
  const { bgTheme, customThemes, designTheme } = useSettingsStore();

  const getThemeSrc = () => {
    let activeTheme = bgTheme;
    if (activeTheme === 'mondayMorning') activeTheme = 'Wallpaper1';
    
    if (!activeTheme) return null;
    const custom = customThemes?.find(t => t.id === activeTheme);
    if (custom) return custom.dataUrl;
    // In Electron: load from unified backgrounds folder
    if (isElectron()) {
      return `asset://backgrounds/${encodeURIComponent(activeTheme + '.jpg')}`;
    }
    return `${import.meta.env.BASE_URL}themes/${activeTheme}.jpg`;
  };

  const navigate = useNavigate();
  const location = useLocation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    let activeTheme = bgTheme;
    if (activeTheme === 'mondayMorning') activeTheme = 'Wallpaper1';

    if (activeTheme) {
      const custom = customThemes?.find(t => t.id === activeTheme);
      let bgUrl;
      if (custom) {
        bgUrl = custom.dataUrl;
      } else if (isElectron()) {
        bgUrl = `asset://backgrounds/${encodeURIComponent(activeTheme + '.jpg')}`;
      }
      if (!bgUrl) bgUrl = `${import.meta.env.BASE_URL}themes/${activeTheme}.jpg`;
      document.body.style.backgroundImage = `url('${bgUrl}')`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.backgroundColor = 'transparent';
    } else {
      document.body.style.backgroundImage = 'none';
      document.body.style.backgroundColor = 'var(--bg-primary)';
    }
  }, [bgTheme, customThemes]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault(); // Prevent page scroll
          window.dispatchEvent(new CustomEvent('timer-shortcut:toggle'));
          break;
        case '1':
          window.dispatchEvent(new CustomEvent('timer-shortcut:switch-focus'));
          break;
        case '2':
          window.dispatchEvent(new CustomEvent('timer-shortcut:switch-break'));
          break;
        case '3':
          window.dispatchEvent(new CustomEvent('timer-shortcut:switch-longBreak'));
          break;
        case 'r':
          if (location.pathname === '/analytics') {
            navigate('/');
          } else {
            navigate('/analytics');
          }
          break;
        case 'escape':
          if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else if (location.pathname !== '/') {
            navigate('/');
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, location.pathname, isSettingsOpen]);

  return (
    <>
      <div 
        className={`app-wrapper theme-${designTheme}`}
        onClick={() => stopCurrentAlarm()}
      >
        <Routes>
          <Route path="/" element={<Timer />} />
          <Route path="/analytics" element={<Analytics />} />
        </Routes>
        <Navigation onOpenSettings={() => setIsSettingsOpen(true)} />
      </div>
      
      {isSettingsOpen && (
        <SettingsModal onClose={() => setIsSettingsOpen(false)} />
      )}
      
      <VercelAnalytics />
    </>
  );
}

export default App;
