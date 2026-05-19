import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppSettings, Notification } from '@/types';

interface SettingsState {
  settings: AppSettings;
  notifications: Notification[];

  updateSettings: (updates: Partial<AppSettings>) => void;
  resetSettings: () => void;

  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const defaultSettings: AppSettings = {
  darkMode: true,
  neonIntensity: 1,
  compactMode: false,
  reducedMotion: false,
  autosaveInterval: 5000,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      notifications: [],

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
      },

      addNotification: (notification) => {
        const id = crypto.randomUUID();
        set((state) => ({
          notifications: [...state.notifications, { ...notification, id }],
        }));

        if (notification.duration !== 0) {
          setTimeout(() => {
            set((state) => ({
              notifications: state.notifications.filter((n) => n.id !== id),
            }));
          }, notification.duration || 5000);
        }
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'quiz-studio-settings',
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
