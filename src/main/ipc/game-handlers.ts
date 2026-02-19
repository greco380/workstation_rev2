import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'

// In-memory game save for MVP. Later: persist to disk.
let savedGameState: string | null = null

export function registerGameHandlers(): void {
  ipcMain.handle(IPC.GAME.SAVE, async (_event, gameState: string) => {
    savedGameState = gameState
    return { success: true }
  })

  ipcMain.handle(IPC.GAME.LOAD, async () => {
    return savedGameState
  })
}
