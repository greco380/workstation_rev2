import { contextBridge, ipcRenderer } from 'electron'
import { IPC } from '../shared/ipc-channels'

const api = {
  ai: {
    submitPrompt: (prompt: string, modelId: string) =>
      ipcRenderer.invoke(IPC.AI.SUBMIT_PROMPT, prompt, modelId),
    getModels: () => ipcRenderer.invoke(IPC.AI.GET_MODELS),
    switchModel: (newModelId: string, messages: unknown[]) =>
      ipcRenderer.invoke(IPC.AI.SWITCH_MODEL, newModelId, messages),
    setApiKey: (provider: string, key: string) =>
      ipcRenderer.invoke(IPC.AI.SET_API_KEY, provider, key),
    getApiKeyStatus: () =>
      ipcRenderer.invoke(IPC.AI.GET_API_KEY_STATUS)
  },
  game: {
    save: (gameState: string) => ipcRenderer.invoke(IPC.GAME.SAVE, gameState),
    load: () => ipcRenderer.invoke(IPC.GAME.LOAD)
  }
}

contextBridge.exposeInMainWorld('api', api)

export type ElectronAPI = typeof api
