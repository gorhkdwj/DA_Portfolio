import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { format, differenceInDays } from 'date-fns';

export const useLogStore = create(
  persist(
    (set, get) => ({
      logs: [],
      currentStreak: 0,
      lastActiveDate: null,

      addLog: (log) => set((state) => {
        // log expected to have: { date, type ('focus'|'break'), duration (seconds) }
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        let newStreak = state.currentStreak;
        
        if (state.lastActiveDate !== todayStr) {
           if (!state.lastActiveDate) {
              newStreak = 1;
           } else {
              const diff = differenceInDays(new Date(), new Date(state.lastActiveDate));
              if (diff === 1) {
                newStreak += 1;
              } else if (diff > 1) {
                newStreak = 1; // streak broken
              }
           }
        }

        return {
          logs: [...state.logs, { ...log, id: Date.now() }],
          currentStreak: newStreak,
          lastActiveDate: todayStr
        };
      }),
      clearLogs: () => set({ logs: [], currentStreak: 0, lastActiveDate: null })
    }),
    {
      name: 'pomodoro-logs',
    }
  )
);
