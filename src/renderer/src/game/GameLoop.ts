import { useGameStore } from '../stores/game-store'

let animationFrameId: number | null = null
let lastTick = 0
const TICK_INTERVAL = 1000 / 20 // 20 ticks per second for game logic

export function startGameLoop(): void {
  if (animationFrameId !== null) return

  lastTick = performance.now()

  function loop(now: number): void {
    const delta = now - lastTick

    if (delta >= TICK_INTERVAL) {
      useGameStore.getState().tick()
      lastTick = now - (delta % TICK_INTERVAL)
    }

    animationFrameId = requestAnimationFrame(loop)
  }

  animationFrameId = requestAnimationFrame(loop)
}

export function stopGameLoop(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}
