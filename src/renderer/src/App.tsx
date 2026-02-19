import { useEffect } from 'react'
import { GameCanvas } from './game/GameCanvas'
import { ModelSelector } from './ui/ModelSelector'
import { ResourceBar } from './ui/ResourceBar'
import { Toolbar } from './ui/Toolbar'
import { PopupManager } from './ui/popups/PopupManager'
import { useGameStore } from './stores/game-store'

export function App(): React.ReactElement {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Don't capture shortcuts when typing in inputs
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const store = useGameStore.getState()

      switch (e.key) {
        case '1':
          store.setBuildMode('belt')
          break
        case '2':
          store.setBuildMode('machine')
          break
        case '3':
          store.setBuildMode('generator')
          break
        case '4':
          store.setBuildMode('storage')
          break
        case '5':
          store.setBuildMode('crafting_table')
          break
        case '6':
          store.setBuildMode('crane_arm')
          break
        case 'x':
        case 'X':
          store.setBuildMode('delete')
          break
        case 'Escape':
          store.setBuildMode(null)
          break
        case 'r':
        case 'R':
          store.rotateBuildDirection()
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
