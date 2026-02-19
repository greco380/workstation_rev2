import { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '../stores/game-store'
import { useUiStore } from '../stores/ui-store'
import { startGameLoop, stopGameLoop } from './GameLoop'
import {
  TILE_SIZE,
  GRID_COLS,
  GRID_ROWS,
  ENTITY_COLORS,
  ITEM_COLORS,
  DIRECTION_VECTORS
} from '../types/game'
import type { TileEntity, Direction, BeltItem, EntityType } from '../types/game'

const GRID_COLOR = '#1e293b'
const GRID_LINE_COLOR = '#334155'
const BACKGROUND_COLOR = '#0f172a'

// Entity label map
const ENTITY_LABELS: Record<EntityType, string> = {
  belt: 'Belt',
  machine: 'M',
  generator: 'Gen',
  storage: 'S',
  crafting_table: 'C',
  crane_arm: 'A'
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  dir: Direction,
  size: number
): void {
  const s = size * 0.3
  ctx.beginPath()
  switch (dir) {
    case 'up':
      ctx.moveTo(cx, cy - s)
      ctx.lineTo(cx - s * 0.6, cy + s * 0.4)
      ctx.lineTo(cx + s * 0.6, cy + s * 0.4)
      break
    case 'down':
      ctx.moveTo(cx, cy + s)
      ctx.lineTo(cx - s * 0.6, cy - s * 0.4)
      ctx.lineTo(cx + s * 0.6, cy - s * 0.4)
      break
    case 'left':
      ctx.moveTo(cx - s, cy)
      ctx.lineTo(cx + s * 0.4, cy - s * 0.6)
      ctx.lineTo(cx + s * 0.4, cy + s * 0.6)
      break
    case 'right':
      ctx.moveTo(cx + s, cy)
      ctx.lineTo(cx - s * 0.4, cy - s * 0.6)
      ctx.lineTo(cx - s * 0.4, cy + s * 0.6)
      break
  }
  ctx.closePath()
  ctx.fill()
}

function drawBeltItem(
  ctx: CanvasRenderingContext2D,
  item: BeltItem,
  beltX: number,
  beltY: number,
  direction: Direction,
  tileSize: number
): void {
  const vec = DIRECTION_VECTORS[direction]
  const cx = beltX + tileSize / 2
  const cy = beltY + tileSize / 2
  const startX = cx - vec.dx * tileSize * 0.35
  const startY = cy - vec.dy * tileSize * 0.35
  const endX = cx + vec.dx * tileSize * 0.35
  const endY = cy + vec.dy * tileSize * 0.35
  const p = Math.min(item.progress, 1.0)
  const ix = startX + (endX - startX) * p
  const iy = startY + (endY - startY) * p
  const radius = tileSize * 0.18

  ctx.fillStyle = ITEM_COLORS[item.type]
  ctx.beginPath()
  ctx.arc(ix, iy, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#1e1e1e'
  ctx.font = `bold ${tileSize * 0.2}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(item.type, ix, iy)
}

function drawEntity(
  ctx: CanvasRenderingContext2D,
  entity: TileEntity,
  tileSize: number
): void {
  const px = entity.x * tileSize
  const py = entity.y * tileSize
  const padding = 2

  ctx.globalAlpha = 0.85

  if (entity.type === 'belt') {
    const item = entity.beltState?.item
    ctx.fillStyle = item ? ITEM_COLORS[item.type] : ENTITY_COLORS.belt
    ctx.beginPath()
    ctx.roundRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2, 4)
    ctx.fill()

    ctx.globalAlpha = 0.6
    ctx.fillStyle = '#000'
    drawArrow(ctx, px + tileSize / 2, py + tileSize / 2, entity.direction, tileSize)
    ctx.globalAlpha = 1

    if (item) {
      drawBeltItem(ctx, item, px, py, entity.direction, tileSize)
    }
  } else if (entity.type === 'machine') {
    ctx.fillStyle = ENTITY_COLORS.machine
    ctx.fillRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
    ctx.globalAlpha = 1

    if (entity.machineState?.processingTicks && entity.machineState.processingTicks > 0) {
      ctx.fillStyle = '#818cf8'
      const progress = 1 - entity.machineState.processingTicks / 40
      ctx.fillRect(px + padding, py + tileSize - 6, (tileSize - padding * 2) * progress, 4)
    }

    if (entity.machineState?.outputReady) {
      ctx.fillStyle = '#fbbf24'
      ctx.fillRect(px + padding, py + tileSize - 6, tileSize - padding * 2, 4)
    }

    ctx.fillStyle = '#c7d2fe'
    ctx.font = `${tileSize * 0.5}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('M', px + tileSize / 2, py + tileSize / 2)
  } else if (entity.type === 'generator') {
    ctx.fillStyle = ENTITY_COLORS.generator
    ctx.beginPath()
    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2 - padding, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.fillStyle = '#d1fae5'
    ctx.font = `${tileSize * 0.35}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('Gen', px + tileSize / 2, py + tileSize / 2)
  } else if (entity.type === 'storage') {
    ctx.fillStyle = ENTITY_COLORS.storage
    ctx.beginPath()
    ctx.roundRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2, 6)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.strokeStyle = '#94a3b8'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2, 6)
    ctx.stroke()

    ctx.fillStyle = '#e2e8f0'
    ctx.font = `${tileSize * 0.5}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('S', px + tileSize / 2, py + tileSize / 2)

    if (entity.storageState) {
      const total = Object.values(entity.storageState.inventory).reduce((a, b) => a + b, 0)
      if (total > 0) {
        ctx.fillStyle = '#f59e0b'
        ctx.font = `bold ${tileSize * 0.22}px monospace`
        ctx.textAlign = 'right'
        ctx.textBaseline = 'top'
        ctx.fillText(`${total}`, px + tileSize - 4, py + 3)
      }
    }
  } else if (entity.type === 'crafting_table') {
    ctx.fillStyle = ENTITY_COLORS.crafting_table
    ctx.fillRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
    ctx.globalAlpha = 1
    ctx.fillStyle = '#e9d5ff'
    ctx.font = `${tileSize * 0.5}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('C', px + tileSize / 2, py + tileSize / 2)
  } else if (entity.type === 'crane_arm') {
    ctx.fillStyle = ENTITY_COLORS.crane_arm
    ctx.fillRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
    ctx.globalAlpha = 1

    if (entity.craneArmState?.isActive) {
      ctx.strokeStyle = '#fbbf24'
      ctx.lineWidth = 3
      ctx.strokeRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
    }

    ctx.fillStyle = '#fecaca'
    ctx.font = `${tileSize * 0.5}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('A', px + tileSize / 2, py + tileSize / 2)
  }

  ctx.globalAlpha = 1
}

/**
 * FIX #2: Draw a semi-transparent ghost preview of the entity
 * about to be placed, with direction arrow visible.
 */
function drawGhostEntity(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: EntityType,
  direction: Direction,
  tileSize: number,
  isOccupied: boolean
): void {
  const px = x * tileSize
  const py = y * tileSize
  const padding = 2

  ctx.globalAlpha = isOccupied ? 0.2 : 0.4
  const color = ENTITY_COLORS[type] || '#888'

  if (type === 'belt') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2, 4)
    ctx.fill()
    ctx.globalAlpha = isOccupied ? 0.15 : 0.35
    ctx.fillStyle = '#000'
    drawArrow(ctx, px + tileSize / 2, py + tileSize / 2, direction, tileSize)
  } else if (type === 'generator') {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(px + tileSize / 2, py + tileSize / 2, tileSize / 2 - padding, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.fillStyle = color
    ctx.fillRect(px + padding, py + padding, tileSize - padding * 2, tileSize - padding * 2)
  }

  // Draw label
  ctx.globalAlpha = isOccupied ? 0.2 : 0.5
  ctx.fillStyle = '#fff'
  ctx.font = `${tileSize * 0.35}px monospace`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(ENTITY_LABELS[type] || '?', px + tileSize / 2, py + tileSize / 2)

  // Red border if occupied
  if (isOccupied) {
    ctx.globalAlpha = 0.6
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2)
  } else {
    ctx.globalAlpha = 0.5
    ctx.strokeStyle = '#22d3ee'
    ctx.lineWidth = 2
    ctx.strokeRect(px + 1, py + 1, tileSize - 2, tileSize - 2)
  }

  ctx.globalAlpha = 1
}

export function GameCanvas(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const camera = useGameStore((s) => s.camera)
  const setCamera = useGameStore((s) => s.setCamera)
  const buildMode = useGameStore((s) => s.buildMode)
  const placeEntity = useGameStore((s) => s.placeEntity)
  const removeEntity = useGameStore((s) => s.removeEntity)
  const openPopup = useUiStore((s) => s.openPopup)

  const isPanningRef = useRef(false)
  const lastMouseRef = useRef({ x: 0, y: 0 })
  const hoverTileRef = useRef<{ x: number; y: number } | null>(null)

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frameId: number

    function render(): void {
      const w = canvas!.width
      const h = canvas!.height
      const state = useGameStore.getState()
      const cam = state.camera
      const currentGrid = state.grid
      const bm = state.buildMode
      const bdir = state.buildDirection
      const tileSize = TILE_SIZE * cam.zoom

      ctx!.fillStyle = BACKGROUND_COLOR
      ctx!.fillRect(0, 0, w, h)

      ctx!.save()
      ctx!.translate(-cam.x * cam.zoom, -cam.y * cam.zoom)

      const startCol = Math.max(0, Math.floor(cam.x / TILE_SIZE))
      const startRow = Math.max(0, Math.floor(cam.y / TILE_SIZE))
      const endCol = Math.min(GRID_COLS, Math.ceil((cam.x + w / cam.zoom) / TILE_SIZE) + 1)
      const endRow = Math.min(GRID_ROWS, Math.ceil((cam.y + h / cam.zoom) / TILE_SIZE) + 1)

      // Grid cells
      for (let col = startCol; col < endCol; col++) {
        for (let row = startRow; row < endRow; row++) {
          const px = col * tileSize
          const py = row * tileSize

          ctx!.fillStyle = GRID_COLOR
          ctx!.fillRect(px, py, tileSize, tileSize)

          ctx!.strokeStyle = GRID_LINE_COLOR
          ctx!.lineWidth = 1
          ctx!.strokeRect(px, py, tileSize, tileSize)
        }
      }

      // Draw entities
      for (const entity of Object.values(currentGrid)) {
        drawEntity(ctx!, entity, tileSize)
      }

      // FIX #2: Ghost preview of entity to be placed
      const hover = hoverTileRef.current
      if (hover && bm && bm !== 'delete') {
        const hoverKey = `${hover.x},${hover.y}`
        const isOccupied = !!currentGrid[hoverKey]
        drawGhostEntity(ctx!, hover.x, hover.y, bm as EntityType, bdir, tileSize, isOccupied)
      } else if (hover && bm === 'delete') {
        // Delete mode: red X overlay
        const px = hover.x * tileSize
        const py = hover.y * tileSize
        ctx!.globalAlpha = 0.4
        ctx!.strokeStyle = '#ef4444'
        ctx!.lineWidth = 3
        ctx!.beginPath()
        ctx!.moveTo(px + 8, py + 8)
        ctx!.lineTo(px + tileSize - 8, py + tileSize - 8)
        ctx!.moveTo(px + tileSize - 8, py + 8)
        ctx!.lineTo(px + 8, py + tileSize - 8)
        ctx!.stroke()
        ctx!.globalAlpha = 1
      }

      ctx!.restore()

      frameId = requestAnimationFrame(render)
    }

    frameId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(frameId)
  }, [])

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    function resize(): void {
      canvas!.width = window.innerWidth
      canvas!.height = window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  // Game loop
  useEffect(() => {
    startGameLoop()
    return () => stopGameLoop()
  }, [])

  const screenToGrid = useCallback(
    (clientX: number, clientY: number) => {
      const worldX = clientX / camera.zoom + camera.x
      const worldY = clientY / camera.zoom + camera.y
      return {
        x: Math.floor(worldX / TILE_SIZE),
        y: Math.floor(worldY / TILE_SIZE)
      }
    },
    [camera]
  )

  /**
   * FIX #1: Right-click on any entity opens its popup (storage, crafting)
   * regardless of current build mode.
   */
  const openEntityPopup = useCallback(
    (entity: TileEntity, screenX: number, screenY: number) => {
      if (entity.type === 'storage') {
        openPopup({
          type: 'storage',
          title: 'Storage',
          position: { x: screenX + 20, y: Math.max(10, screenY - 100) },
          data: { entityId: entity.id }
        })
      } else if (entity.type === 'crafting_table') {
        openPopup({
          type: 'crafting',
          title: 'Crafting Table',
          position: { x: screenX + 20, y: Math.max(10, screenY - 100) },
          data: { entityId: entity.id }
        })
      }
    },
    [openPopup]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Middle click = always pan
      if (e.button === 1) {
        isPanningRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
        return
      }

      const tile = screenToGrid(e.clientX, e.clientY)
      const inBounds = tile.x >= 0 && tile.x < GRID_COLS && tile.y >= 0 && tile.y < GRID_ROWS
      const entity = inBounds ? useGameStore.getState().grid[`${tile.x},${tile.y}`] : undefined

      // Right click = open entity popup (FIX #1)
      if (e.button === 2 && entity) {
        openEntityPopup(entity, e.clientX, e.clientY)
        return
      }

      // Left click in build mode
      if (e.button === 0 && buildMode && inBounds) {
        if (buildMode === 'delete') {
          removeEntity(tile.x, tile.y)
        } else {
          placeEntity(tile.x, tile.y)
        }
        return
      }

      // Left click in select mode — click entity or pan
      if (e.button === 0 && !buildMode) {
        if (entity) {
          openEntityPopup(entity, e.clientX, e.clientY)
          return
        }
        isPanningRef.current = true
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      }
    },
    [buildMode, screenToGrid, placeEntity, removeEntity, openEntityPopup]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanningRef.current) {
        const dx = (e.clientX - lastMouseRef.current.x) / camera.zoom
        const dy = (e.clientY - lastMouseRef.current.y) / camera.zoom
        setCamera({ x: camera.x - dx, y: camera.y - dy })
        lastMouseRef.current = { x: e.clientX, y: e.clientY }
      }

      const tile = screenToGrid(e.clientX, e.clientY)
      if (tile.x >= 0 && tile.x < GRID_COLS && tile.y >= 0 && tile.y < GRID_ROWS) {
        hoverTileRef.current = tile
      } else {
        hoverTileRef.current = null
      }
    },
    [camera, screenToGrid, setCamera]
  )

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false
  }, [])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.3, Math.min(3, camera.zoom * zoomFactor))
      setCamera({ zoom: newZoom })
    },
    [camera.zoom, setCamera]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      onContextMenu={handleContextMenu}
    />
  )
}
