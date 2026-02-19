export type Direction = 'up' | 'down' | 'left' | 'right'
export type EntityType = 'belt' | 'machine' | 'generator' | 'storage' | 'crafting_table' | 'crane_arm'
export type ItemType = 'P' | 'I' | 'G'

// Colors belts turn when carrying each item type
export const ITEM_COLORS: Record<ItemType, string> = {
  P: '#f59e0b', // amber (Prompt coal)
  I: '#94a3b8', // silver (Iron)
  G: '#b45309'  // copper (Gear)
}

// Item label for rendering
export const ITEM_LABELS: Record<ItemType, string> = {
  P: 'P',
  I: 'I',
  G: 'G'
}

// Entity rendering colors
export const ENTITY_COLORS: Record<EntityType, string> = {
  belt: '#78350f',          // dark amber (no item)
  machine: '#6366f1',       // indigo
  generator: '#10b981',     // green
  storage: '#64748b',       // slate
  crafting_table: '#a855f7', // purple
  crane_arm: '#dc2626'      // red
}

export interface BeltItem {
  id: string
  type: ItemType
  /** 0.0 = just entered tile, 1.0 = about to exit. Advances by BELT_SPEED per tick. */
  progress: number
}

export interface BeltState {
  item: BeltItem | null
}

export interface MachineState {
  processingTicks: number
  outputReady: boolean
}

export interface StorageState {
  inventory: Record<ItemType, number>
}

export interface CraftingState {
  inputSlots: (ItemType | null)[]
  outputSlot: { type: ItemType; count: number } | null
}

export interface CraneArmState {
  isActive: boolean
  cooldownTicks: number
}

export interface TileEntity {
  id: string
  type: EntityType
  x: number
  y: number
  direction: Direction
  beltState?: BeltState
  machineState?: MachineState
  storageState?: StorageState
  craftingState?: CraftingState
  craneArmState?: CraneArmState
}

export interface GameResources {
  credits: number
  energy: number
}

export interface Camera {
  x: number
  y: number
  zoom: number
}

// Constants
export const TILE_SIZE = 48
export const GRID_COLS = 50
export const GRID_ROWS = 50

export const BELT_SPEED = 0.1           // progress per tick (10 ticks = 0.5s to cross one belt at 20 TPS)
export const MACHINE_PROCESS_TICKS = 40 // 2 seconds at 20 TPS
export const MACHINE_ENERGY_COST = 0.5  // energy per iron produced
export const CRANE_COOLDOWN_TICKS = 10  // 0.5s between pickups
export const GENERATOR_ENERGY_PER_TICK = 0.1
export const BELT_ENERGY_PER_TICK = 0.01

export const DIRECTION_VECTORS: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
}

export const EMPTY_STORAGE: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
