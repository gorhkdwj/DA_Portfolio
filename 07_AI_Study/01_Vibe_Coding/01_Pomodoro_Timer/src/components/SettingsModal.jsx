import React, { useState } from 'react';
import { X, Save, Volume2, PlayCircle, Globe } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { getTranslation } from '../utils/i18n';
import { playBeep } from '../utils/sound';
import { saveAssetToLocal, deleteLocalAsset, isElectron } from '../utils/fsHelper';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
  const settings = useSettingsStore();
  const t = (key) => getTranslation(settings.language, key);
  
  const [localFocus, setLocalFocus] = useState(settings.focusTime);
  const [localBreak, setLocalBreak] = useState(settings.breakTime);
  const [localLongBreak, setLocalLongBreak] = useState(settings.longBreakTime);
  const [localLongBreakInterval, setLocalLongBreakInterval] = useState(settings.longBreakInterval);
  const [localAutoBreak, setLocalAutoBreak] = useState(settings.autoStartBreaks);
  const [localAutoPom, setLocalAutoPom] = useState(settings.autoStartPoms);
  const [localFocusVolume, setLocalFocusVolume] = useState(settings.focusVolume !== undefined ? settings.focusVolume : 0.5);
  const [localBreakVolume, setLocalBreakVolume] = useState(settings.breakVolume !== undefined ? settings.breakVolume : 0.5);
  const [localFocusSound, setLocalFocusSound] = useState(settings.focusSound);
  const [localBreakSound, setLocalBreakSound] = useState(settings.breakSound);
  const [localPresetId, setLocalPresetId] = useState(settings.selectedPresetId);
  const [localLanguage, setLocalLanguage] = useState(settings.language);
  const [localBgTheme, setLocalBgTheme] = useState(settings.bgTheme || 'mondayMorning');
  const [localDesignTheme, setLocalDesignTheme] = useState(settings.designTheme || 'minimal');
  const [playingPreview, setPlayingPreview] = useState(null); // stores soundType being played
  const [lastPreviewedSound, setLastPreviewedSound] = useState(null); // Remembers last playing context for volume slider
  const [showConfirmClose, setShowConfirmClose] = useState(false); // Controls custom confirm dialog
  
  // Track if changes are made to prompt user before closing
  const isDirty = (
    localFocus !== settings.focusTime ||
    localBreak !== settings.breakTime ||
    localLongBreak !== settings.longBreakTime ||
    localLongBreakInterval !== settings.longBreakInterval ||
    localAutoBreak !== settings.autoStartBreaks ||
    localAutoPom !== settings.autoStartPoms ||
    localFocusVolume !== settings.focusVolume ||
    localBreakVolume !== settings.breakVolume ||
    localFocusSound !== settings.focusSound ||
    localBreakSound !== settings.breakSound ||
    localPresetId !== settings.selectedPresetId ||
    localLanguage !== settings.language ||
    localBgTheme !== settings.bgTheme ||
    localDesignTheme !== settings.designTheme
  );
  
  const themeInputRef = React.useRef(null);
  const focusInputRef = React.useRef(null);
  const breakInputRef = React.useRef(null);
  const activeAudioCleanup = React.useRef(null);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const fileUrl = await saveAssetToLocal(file, type);
      if (!fileUrl) {
        alert("Failed to save asset. Run in Electron.");
        return;
      }
      
      const id = 'custom_' + Date.now();
      
      if (type === 'theme') {
        settings.addCustomTheme({ id, name: file.name, dataUrl: fileUrl });
        setLocalBgTheme(id);
      } else if (type === 'focus') {
        settings.addCustomSound({ id, name: file.name, dataUrl: fileUrl });
        setLocalFocusSound(fileUrl);
      } else if (type === 'break') {
        settings.addCustomSound({ id, name: file.name, dataUrl: fileUrl });
        setLocalBreakSound(fileUrl);
      }
    } catch (err) {
      console.error(err);
      alert("Error saving file locally.");
    }

    e.target.value = ''; // reset input
  };

  React.useEffect(() => {
    // Live background preview while settings modal is open
    let activeTheme = localBgTheme;
    if (activeTheme === 'mondayMorning') activeTheme = 'Wallpaper1';

    if (activeTheme && activeTheme !== 'none') {
      const custom = settings.customThemes?.find(t => t.id === activeTheme);
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
  }, [localBgTheme, settings.customThemes]);

  React.useEffect(() => {
    // Cleanup active audio when modal closes or unmounts.
    // Background restoration is delegated entirely to App.jsx's useEffect,
    // which watches the Zustand store with correct absolute paths (/themes/).
    // Do NOT touch document.body background here — Electron file:// paths would break it.
    return () => {
      if (activeAudioCleanup.current) {
        activeAudioCleanup.current();
      }
    };
  }, []);

  const handlePresetChange = (e) => {
    const pId = e.target.value;
    setLocalPresetId(pId);
    
    if (pId !== 'custom') {
      const preset = settings.presets.find(p => p.id === pId);
      if (preset) {
        setLocalFocus(preset.focus);
        setLocalBreak(preset.break);
        setLocalLongBreak(preset.longBreak || 15);
        setLocalLongBreakInterval(preset.interval !== undefined ? preset.interval : 4);
      }
    }
  };

  const handleSave = () => {
    settings.setBgTheme(localBgTheme);
    settings.setDesignTheme(localDesignTheme);
    settings.setLanguage(localLanguage);
    settings.setFocusTime(localFocus);
    settings.setBreakTime(localBreak);
    settings.setLongBreakTime(localLongBreak);
    settings.setLongBreakInterval(localLongBreakInterval);
    settings.setAutoStartBreaks(localAutoBreak);
    settings.setAutoStartPoms(localAutoPom);
    settings.setFocusVolume(localFocusVolume);
    settings.setBreakVolume(localBreakVolume);
    settings.setFocusSound(localFocusSound);
    settings.setBreakSound(localBreakSound);
    settings.setSelectedPreset(localPresetId);
    onClose();
  };

  const previewSound = (soundType) => {
    if (activeAudioCleanup.current) {
      activeAudioCleanup.current();
      activeAudioCleanup.current = null;
    }
    
    if (playingPreview === soundType) {
      // Toggle off
      setPlayingPreview(null);
    } else {
      // Toggle on
      setPlayingPreview(soundType);
      setLastPreviewedSound(soundType);
      const volToUse = soundType === localFocusSound ? localFocusVolume : localBreakVolume;
      const stopSound = playBeep(soundType, volToUse);
      activeAudioCleanup.current = stopSound;
      
      // Auto-reset button state after a generous amount of time if we can't reliably track 'ended' event for oscillators 
      // Most of our sounds are short, 5 seconds is safe.
      setTimeout(() => {
        setPlayingPreview((prev) => (prev === soundType ? null : prev));
      }, 5000);
    }
  };

  const handleFocusVolumeChange = (e) => {
    setLocalFocusVolume(parseFloat(e.target.value));
  };

  const handleBreakVolumeChange = (e) => {
    setLocalBreakVolume(parseFloat(e.target.value));
  };
  
  const handleFocusVolumeRelease = () => {
    if (activeAudioCleanup.current) {
      activeAudioCleanup.current();
    }
    
    const stopSound = playBeep(localFocusSound, localFocusVolume);
    activeAudioCleanup.current = stopSound;
    setPlayingPreview(localFocusSound);
    setLastPreviewedSound(localFocusSound);
    setTimeout(() => {
        setPlayingPreview((prev) => (prev === localFocusSound ? null : prev));
    }, 1000);
  };

  const handleBreakVolumeRelease = () => {
    if (activeAudioCleanup.current) {
      activeAudioCleanup.current();
    }
    
    const stopSound = playBeep(localBreakSound, localBreakVolume);
    activeAudioCleanup.current = stopSound;
    setPlayingPreview(localBreakSound);
    setLastPreviewedSound(localBreakSound);
    setTimeout(() => {
        setPlayingPreview((prev) => (prev === localBreakSound ? null : prev));
    }, 1000);
  };

  const handleClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
      return;
    }
    onClose();
  };

  const getPresetName = (name) => {
    if (name === 'Classic Pomodoro') return t('classicPomodoro');
    if (name === 'Long Focus') return t('longFocus');
    if (name === 'Short Flow') return t('shortFlow');
    return name;
  };

  return (
    <>
    <div className="modal-overlay" onClick={() => {
      if (activeAudioCleanup.current) activeAudioCleanup.current();
      handleClose();
    }}>
      <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{t('settings')}</h3>
          <button className="close-btn" onClick={() => {
            if (activeAudioCleanup.current) activeAudioCleanup.current();
            handleClose();
          }}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <h4><Globe size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />{t('display')}</h4>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>{t('language')}</label>
                <select 
                  className="settings-select styled-select"
                  value={localLanguage}
                  onChange={e => setLocalLanguage(e.target.value)}
                >
                  <option value="ko">{t('langKo')}</option>
                  <option value="en">{t('langEn')}</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>{t('designTheme') || 'Design Theme'}</label>
                <select 
                  className="settings-select styled-select"
                  value={localDesignTheme}
                  onChange={e => setLocalDesignTheme(e.target.value)}
                >
                  <option value="minimal">Minimalist</option>
                  <option value="glassmorphism">Glassmorphism</option>
                  <option value="cyberpunk">Cyberpunk Neon</option>
                </select>
              </div>
            </div>
            
            <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>{t('backgroundTheme')}</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <select 
                className="settings-select styled-select flex-1"
                value={localBgTheme}
                onChange={e => setLocalBgTheme(e.target.value)}
              >
                <option value="Wallpaper1">{t('theme1')}</option>
                <option value="Wallpaper2">{t('theme2')}</option>
                <option value="Wallpaper3">{t('theme3')}</option>
                <option value="Wallpaper4">{t('theme4')}</option>
                <option value="Wallpaper5">{t('theme5')}</option>
                <option value="Wallpaper6">{t('theme6')}</option>
                {settings.customThemes?.map(t => (
                  <option key={t.id} value={t.id}>{t.name} (Custom)</option>
                ))}
              </select>
              {localBgTheme.startsWith('custom_') && (
                <button 
                  className="delete-custom-btn" 
                  onClick={() => {
                    const theme = settings.customThemes?.find(t => t.id === localBgTheme);
                    if (theme) deleteLocalAsset(theme.dataUrl);
                    settings.removeCustomTheme(localBgTheme);
                    setLocalBgTheme('mondayMorning');
                  }}
                  title={t('deleteCustom')}
                >
                  <X size={20} />
                </button>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              ref={themeInputRef} 
              style={{ display: 'none' }} 
              onChange={e => handleFileUpload(e, 'theme')} 
            />
            <button className="upload-btn" onClick={() => themeInputRef.current.click()}>
              {t('addCustomTheme')}
            </button>
          </section>

          <section className="settings-section">
            <h4>{t('timer')}</h4>
            <select 
              className="settings-select styled-select" 
              value={localPresetId} 
              onChange={handlePresetChange}
            >
              {settings.presets.map(p => (
                <option key={p.id} value={p.id}>{getPresetName(p.name)} ({p.focus}/{p.break})</option>
              ))}
              <option value="custom">{t('custom')}</option>
            </select>
          </section>

          {localPresetId === 'custom' && (
            <section className="settings-section time-inputs fade-in" style={{ flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 40%' }}>
                <label>{t('focusTime')} ({t('minutes')})</label>
                <input 
                  type="number" 
                  min="1" max="120" 
                  value={localFocus} 
                  onChange={e => setLocalFocus(Number(e.target.value))}
                />
              </div>
              <div style={{ flex: '1 1 40%' }}>
                <label>{t('breakTime')} ({t('minutes')})</label>
                <input 
                  type="number" 
                  min="1" max="60" 
                  value={localBreak} 
                  onChange={e => setLocalBreak(Number(e.target.value))}
                />
              </div>
              <div style={{ flex: '1 1 40%' }}>
                <label>{t('longBreakTime')} ({t('minutes')})</label>
                <input 
                  type="number" 
                  min="1" max="60" 
                  value={localLongBreak} 
                  onChange={e => setLocalLongBreak(Number(e.target.value))}
                />
              </div>
              <div style={{ flex: '1 1 40%' }}>
                <label>{t('longBreakInterval')}</label>
                <input 
                  type="number" 
                  min="0" max="10" 
                  value={localLongBreakInterval} 
                  onChange={e => setLocalLongBreakInterval(Number(e.target.value))}
                />
              </div>
            </section>
          )}

          <section className="settings-section toggles">
            <label className="toggle-label">
              <span>{t('autoStartPomodoros')}</span>
              <input 
                type="checkbox" 
                checked={localAutoPom} 
                onChange={e => setLocalAutoPom(e.target.checked)} 
              />
              <span className="toggle-switch"></span>
            </label>
            <label className="toggle-label">
              <span>{t('autoStartBreaks')}</span>
              <input 
                type="checkbox" 
                checked={localAutoBreak} 
                onChange={e => setLocalAutoBreak(e.target.checked)} 
              />
              <span className="toggle-switch"></span>
            </label>
          </section>

          <section className="settings-section">
            <h4><Volume2 size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />{t('sound')}</h4>
            <div className="sound-controls">
              
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>{t('focusSound')}</label>
                <div className="sound-preview-row">
                  <select 
                    className="settings-select styled-select flex-1"
                    value={localFocusSound}
                    onChange={e => setLocalFocusSound(e.target.value)}
                  >
                    <option value="쉬는시간 1.mp3">{t('breakTime1')}</option>
                    <option value="City_Lights_Recharge.mp3">{t('cityLights')}</option>
                    <option value="AirHorn.wav">{t('airHorn')}</option>
                    <option value="MetalGong.wav">{t('metalGong')}</option>
                    <option value="bell">{t('softBell')}</option>
                    <option value="digital">{t('digitalBeep')}</option>
                    <option value="wood">{t('woodBlock')}</option>
                    {settings.customSounds?.map(s => (
                      <option key={s.id} value={s.dataUrl}>{s.name} (Custom)</option>
                    ))}
                  </select>
                  {localFocusSound.startsWith('asset://') || localFocusSound.startsWith('file://') || localFocusSound.startsWith('data:audio') || localFocusSound.startsWith('blob:') ? (
                    <button 
                      className="delete-custom-btn" 
                      onClick={() => {
                        const soundDetails = settings.customSounds.find(s => s.dataUrl === localFocusSound);
                        if (soundDetails) {
                          deleteLocalAsset(soundDetails.dataUrl);
                          settings.removeCustomSound(soundDetails.id);
                        }
                        setLocalFocusSound('City_Lights_Recharge.mp3');
                      }}
                      title={t('deleteCustom')}
                    >
                      <X size={20} />
                    </button>
                  ) : null}
                  <button className="preview-btn" onClick={() => previewSound(localFocusSound)} title={playingPreview === localFocusSound ? "Stop" : "Preview"}>
                    <PlayCircle size={28} style={{ color: playingPreview === localFocusSound ? '#ef4444' : 'inherit' }} />
                  </button>
                </div>
                <div className="volume-slider">
                  <Volume2 size={16} style={{ color: 'var(--text-secondary)' }} />
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={localFocusVolume} 
                    onChange={handleFocusVolumeChange} 
                    onMouseUp={handleFocusVolumeRelease}
                    onTouchEnd={handleFocusVolumeRelease}
                  />
                </div>
                <input 
                  type="file" 
                  accept="audio/*" 
                  ref={focusInputRef} 
                  style={{ display: 'none' }} 
                  onChange={e => handleFileUpload(e, 'focus')} 
                />
                <button className="upload-btn" onClick={() => focusInputRef.current.click()}>
                  {t('addCustomSound')}
                </button>
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ fontSize: '0.9rem', opacity: 0.8, display: 'block', marginBottom: '4px' }}>{t('breakSound')}</label>
                <div className="sound-preview-row">
                  <select 
                    className="settings-select styled-select flex-1"
                    value={localBreakSound}
                    onChange={e => setLocalBreakSound(e.target.value)}
                  >
                    <option value="쉬는시간 1.mp3">{t('breakTime1')}</option>
                    <option value="City_Lights_Recharge.mp3">{t('cityLights')}</option>
                    <option value="AirHorn.wav">{t('airHorn')}</option>
                    <option value="MetalGong.wav">{t('metalGong')}</option>
                    <option value="bell">{t('softBell')}</option>
                    <option value="digital">{t('digitalBeep')}</option>
                    <option value="wood">{t('woodBlock')}</option>
                    {settings.customSounds?.map(s => (
                      <option key={s.id} value={s.dataUrl}>{s.name} (Custom)</option>
                    ))}
                  </select>
                  {localBreakSound.startsWith('asset://') || localBreakSound.startsWith('file://') || localBreakSound.startsWith('data:audio') || localBreakSound.startsWith('blob:') ? (
                    <button 
                      className="delete-custom-btn" 
                      onClick={() => {
                        const soundDetails = settings.customSounds.find(s => s.dataUrl === localBreakSound);
                        if (soundDetails) {
                          deleteLocalAsset(soundDetails.dataUrl);
                          settings.removeCustomSound(soundDetails.id);
                        }
                        setLocalBreakSound('bell');
                      }}
                      title={t('deleteCustom')}
                    >
                      <X size={20} />
                    </button>
                  ) : null}
                  <button className="preview-btn" onClick={() => previewSound(localBreakSound)} title={playingPreview === localBreakSound ? "Stop" : "Preview"}>
                    <PlayCircle size={28} style={{ color: playingPreview === localBreakSound ? '#ef4444' : 'inherit' }} />
                  </button>
                </div>
                <div className="volume-slider">
                  <Volume2 size={16} style={{ color: 'var(--text-secondary)' }} />
                  <input 
                    type="range" 
                    min="0" max="1" step="0.1" 
                    value={localBreakVolume} 
                    onChange={handleBreakVolumeChange} 
                    onMouseUp={handleBreakVolumeRelease}
                    onTouchEnd={handleBreakVolumeRelease}
                  />
                </div>
                <input 
                  type="file" 
                  accept="audio/*" 
                  ref={breakInputRef} 
                  style={{ display: 'none' }} 
                  onChange={e => handleFileUpload(e, 'break')} 
                />
                <button className="upload-btn" onClick={() => breakInputRef.current.click()}>
                  {t('addCustomSound')}
                </button>
              </div>
            </div>
          </section>

          <section className="settings-section toggles">
             <div style={{fontWeight: 600, fontSize: '0.95rem', marginBottom: '8px', color: 'var(--text-primary)'}}>
               {t('shortcuts')}
             </div>
             <ul style={{fontSize: '0.85rem', color: 'var(--text-secondary)', paddingLeft: '16px', margin: 0, display: 'flex', flexDirection: 'column', gap: '6px'}}>
                <li>{t('shortcutSpace')}</li>
                <li>{t('shortcut1')}</li>
                <li>{t('shortcut2')}</li>
                <li>{t('shortcut3')}</li>
                <li>{t('shortcutR')}</li>
                <li>{t('shortcutEsc')}</li>
             </ul>
          </section>

        </div>

        <div className="modal-footer">
          <button className="save-btn" onClick={handleSave}>
            <Save size={18} />
            {t('saveChanges')}
          </button>
        </div>
      </div>
    </div>
    
    {showConfirmClose && (
      <div className="modal-overlay" style={{ zIndex: 3000 }}>
        <div className="confirm-dialog glass-panel" style={{ minWidth: '340px', padding: '28px 24px' }}>
          <h4>{t('unsavedChanges') || 'Unsaved Changes'}</h4>
          <p style={{ marginTop: '12px', marginBottom: '24px', color: 'var(--text-secondary)', lineHeight: 1.5, wordBreak: 'keep-all' }}>
            {t('unsavedPrompt') || '변경사항이 있습니다. 어떻게 할까요?'}
          </p>
          <div className="confirm-actions" style={{ display: 'flex', gap: '12px' }}>
            <button className="confirm-btn" style={{ flex: 1, backgroundColor: 'var(--accent-break)', color: 'white', whiteSpace: 'nowrap' }} onClick={() => { handleSave(); setShowConfirmClose(false); }}>
              {t('saveAndExit') || 'Save and Exit'}
            </button>
            <button className="confirm-btn discard" style={{ flex: 1, whiteSpace: 'nowrap' }} onClick={onClose}>
              {t('exitWithoutSaving') || 'Exit Without Saving'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
