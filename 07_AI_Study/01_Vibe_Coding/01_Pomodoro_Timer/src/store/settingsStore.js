import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_PRESETS = [
  { id: '1', name: 'Classic Pomodoro', focus: 25, break: 5, longBreak: 15, interval: 4 },
  { id: '2', name: 'Long Focus', focus: 50, break: 10, longBreak: 30, interval: 4 },
  { id: '3', name: 'Short Flow', focus: 15, break: 3, longBreak: 10, interval: 4 }
];

export const useSettingsStore = create(
  persist(
    (set) => ({
      focusTime: 25, // in minutes
      breakTime: 5,  // in minutes
      longBreakTime: 15, // in minutes
      longBreakInterval: 4, // 0 means disabled
      autoStartBreaks: false,
      autoStartPoms: false,
      selectedPresetId: '1',
      presets: DEFAULT_PRESETS,
      focusVolume: 0.5,
      breakVolume: 0.5,
      focusSound: '쉬는시간 1.mp3', // Default Focus sound
      breakSound: 'City_Lights_Recharge.mp3', // Default Break sound
      language: 'ko', // 'ko', 'en'
      bgTheme: 'mondayMorning', // 'none', 'Wallpaper1', etc.
      designTheme: 'minimal', // 'glassmorphism', 'minimal', 'cyberpunk'
      customThemes: [], // Array of { id, name, dataUrl }
      customSounds: [], // Array of { id, name, dataUrl }
      
      setFocusTime: (time) => set({ focusTime: time }),
      setBreakTime: (time) => set({ breakTime: time }),
      setLongBreakTime: (time) => set({ longBreakTime: time }),
      setLongBreakInterval: (interval) => set({ longBreakInterval: interval }),
      setAutoStartBreaks: (val) => set({ autoStartBreaks: val }),
      setAutoStartPoms: (val) => set({ autoStartPoms: val }),
      setSelectedPreset: (id) => {
        set((state) => {
          const preset = state.presets.find(p => p.id === id);
          if (preset) {
            return { 
              selectedPresetId: id, 
              focusTime: preset.focus, 
              breakTime: preset.break,
              longBreakTime: preset.longBreak || 15,
              longBreakInterval: preset.interval !== undefined ? preset.interval : 4
            };
          }
          return { selectedPresetId: id };
        });
      },
      addPreset: (preset) => set((state) => ({ presets: [...state.presets, preset] })),
      removePreset: (id) => set((state) => ({ presets: state.presets.filter(p => p.id !== id) })),
      setFocusVolume: (vol) => set({ focusVolume: vol }),
      setBreakVolume: (vol) => set({ breakVolume: vol }),
      setFocusSound: (type) => set({ focusSound: type }),
      setBreakSound: (type) => set({ breakSound: type }),
      setLanguage: (lang) => set({ language: lang }),
      setBgTheme: (theme) => set({ bgTheme: theme }),
      setDesignTheme: (theme) => set({ designTheme: theme }),
      addCustomTheme: (themeObj) => set((state) => ({ customThemes: [...state.customThemes, themeObj] })),
      addCustomSound: (soundObj) => set((state) => ({ customSounds: [...state.customSounds, soundObj] })),
      removeCustomTheme: (id) => set((state) => ({ 
        customThemes: state.customThemes.filter(t => t.id !== id),
        bgTheme: state.bgTheme === id ? 'none' : state.bgTheme 
      })),
      removeCustomSound: (id) => set((state) => ({ 
        customSounds: state.customSounds.filter(s => s.id !== id),
        focusSound: state.focusSound === id ? 'bell' : state.focusSound,
        breakSound: state.breakSound === id ? 'bell' : state.breakSound,
      }))
    }),
    {
      name: 'pomodoro-settings',
    }
  )
);
