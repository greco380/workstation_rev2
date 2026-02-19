import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { PopupConfig } from '../types/ai'

interface UiStore {
  popups: PopupConfig[]
  showHud: boolean

  // Actions
  openPopup: (config: Omit<PopupConfig, 'id'>) => string
  closePopup: (id: string) => void
  updatePopupPosition: (id: string, x: number, y: number) => void
  toggleHud: () => void
}

export const useUiStore = create<UiStore>((set) => ({
  popups: [],
  showHud: true,

  openPopup: (config) => {
    const id = uuid()
    set((state) => ({
      popups: [...state.popups, { ...config, id }]
    }))
    return id
  },

  closePopup: (id) => {
    set((state) => ({
      popups: state.popups.filter((p) => p.id !== id)
    }))
  },

  updatePopupPosition: (id, x, y) => {
    set((state) => ({
      popups: state.popups.map((p) =>
        p.id === id ? { ...p, position: { x, y } } : p
      )
    }))
  },

  toggleHud: () => set((state) => ({ showHud: !state.showHud }))
}))
