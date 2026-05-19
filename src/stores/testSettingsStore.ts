import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { QuizSettings } from '@/types';

export interface TestSettingsState {
  settings: QuizSettings;
  updateSettings: (updates: Partial<QuizSettings>) => void;
  resetSettings: () => void;
}

const defaultTestSettings: QuizSettings = {
  shuffleQuestions: false,
  shuffleAnswers: true,
  instantFeedback: false,
  enableTimer: false,
  timerMinutes: 30,
};

export const useTestSettingsStore = create<TestSettingsState>()(
  persist(
    (set) => ({
      settings: defaultTestSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultTestSettings });
      },
    }),
    {
      name: 'quiz-editor-settings',
    }
  )
);
