import { useEffect } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { ModelSelector } from './ui/ModelSelector'
import { ResourceBar } from './ui/ResourceBar'
import { Toolbar } from './ui/Toolbar'
import { PopupManager } from './ui/popups/PopupManager'
import { useGameStore } from './stores/game-store'
import { useUiStore } from './stores/ui-store'

export function App(): React.ReactElement {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't capture shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const gameStore = useGameStore.getState()
      const uiStore = useUiStore.getState()

      switch (e.key) {
        case '1':
          gameStore.setBuildMode('belt')
          break
        case '2':
          gameStore.setBuildMode('machine')
          break
        case '3':
          gameStore.setBuildMode('generator')
          break
        case '4':
          gameStore.setBuildMode('storage')
          break
        case '5':
          gameStore.setBuildMode('crafting_table')
          break
        case '6':
          gameStore.setBuildMode('crane_arm')
          break
        case 'x':
        case 'X':
          gameStore.setBuildMode('delete')
          break
        case 'q':
        case 'Q':
          if (uiStore.popups.length > 0) {
            // Close only the topmost popup layer
            uiStore.closeTopmostPopup()
          } else {
            // Stop using currently selected item
            gameStore.setBuildMode(null)
          }
          break
        case 'Escape':
          // Stop using currently selected item
          gameStore.setBuildMode(null)
          break
        case 'r':
        case 'R':
          gameStore.rotateBuildDirection()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      <GameCanvas />
      <ModelSelector />
      <ResourceBar />
      <Toolbar />
      <PopupManager />
    </div>
  )
}
