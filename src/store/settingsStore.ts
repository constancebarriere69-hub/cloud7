import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AppSettings } from '../types'

interface SettingsStore {
  settings: AppSettings
  updateSettings: (partial: Partial<AppSettings>) => void
}

const defaultSettings: AppSettings = {
  googleClientId: '',
  llmProvider: 'none',
  llmApiKey: '',
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (partial) =>
        set((state) => ({ settings: { ...state.settings, ...partial } })),
    }),
    { name: 'ai-video-studio-settings' },
  ),
)
