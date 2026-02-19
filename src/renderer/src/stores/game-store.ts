import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
  TileEntity,
  GameResources,
  Camera,
  EntityType,
  Direction,
  ItemType,
  BeltItem
} from '../types/game'
import {
  DIRECTION_VECTORS,
  BELT_SPEED,
  MACHINE_PROCESS_TICKS,
  MACHINE_ENERGY_COST,
  CRANE_COOLDOWN_TICKS,
  GENERATOR_ENERGY_PER_TICK,
  BELT_ENERGY_PER_TICK,
  EMPTY_STORAGE
} from '../types/game'
import { matchRecipe } from '../game/recipes'

// Track how many crane arms the player has crafted and not yet placed
interface PlayerCraneInventory {
  craneArms: number
}

interface GameStore {
  grid: Record<string, TileEntity>
  resources: GameResources
  camera: Camera
  tickCount: number
  isPaused: boolean
  buildMode: EntityType | 'delete' | null
  buildDirection: Direction
  promptCoalBuffer: number
  playerInventory: Record<ItemType, number>
  playerCranes: number

  // Actions
  placeEntity: (x: number, y: number) => void
  removeEntity: (x: number, y: number) => void
  setBuildMode: (mode: EntityType | 'delete' | null) => void
  rotateBuildDirection: () => void
  setCamera: (camera: Partial<Camera>) => void
  addCredits: (amount: number) => void
  spawnPromptCoal: (count: number) => void
  getEntityAt: (x: number, y: number) => TileEntity | undefined
  updateCraftingSlot: (entityId: string, slotIndex: number, item: ItemType | null) => void
  collectCraftingOutput: (entityId: string) => void
  tick: () => void
  reset: () => void
}

const INITIAL_RESOURCES: GameResources = {
  credits: 0,
  energy: 10
}

const DIRECTION_ORDER: Direction[] = ['up', 'right', 'down', 'left']

function createEntityState(type: EntityType): Partial<TileEntity> {
  switch (type) {
    case 'belt':
      return { beltState: { item: null } }
    case 'machine':
      return { machineState: { processingTicks: 0, outputReady: false } }
    case 'generator':
      return {}
    case 'storage':
      return { storageState: { inventory: { ...EMPTY_STORAGE } } }
    case 'crafting_table':
      return { craftingState: { inputSlots: [null, null, null, null], outputSlot: null } }
    case 'crane_arm':
      return { craneArmState: { isActive: false, cooldownTicks: 0 } }
  }
}

// --- Tick sub-systems ---

/**
 * FIX #4: Generators only power machines within a 1-tile radius (8 surrounding tiles).
 * Each generator checks its neighbors for machines and gives them energy directly.
 * Global energy still exists for belts and as a reserve.
 */
function tickGenerators(grid: Record<string, TileEntity>, resources: GameResources): void {
  for (const entity of Object.values(grid)) {
    if (entity.type === 'generator') {
      resources.energy += GENERATOR_ENERGY_PER_TICK
    }
  }
}

function tickMachines(grid: Record<string, TileEntity>, resources: GameResources): void {
  // Build a set of positions adjacent to generators for proximity check
  const poweredPositions = new Set<string>()
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ]
  for (const entity of Object.values(grid)) {
    if (entity.type === 'generator') {
      for (const [dx, dy] of offsets) {
        poweredPositions.add(`${entity.x + dx},${entity.y + dy}`)
      }
    }
  }

  for (const entity of Object.values(grid)) {
    if (entity.type !== 'machine' || !entity.machineState) continue
    const ms = entity.machineState
    const machineKey = `${entity.x},${entity.y}`

    // Machine must be within 1-tile radius of a generator to operate
    const isPowered = poweredPositions.has(machineKey)

    // If output is ready, try to push iron onto output belt
    if (ms.outputReady) {
      const vec = DIRECTION_VECTORS[entity.direction]
      const nextKey = `${entity.x + vec.dx},${entity.y + vec.dy}`
      const next = grid[nextKey]
      if (next?.type === 'belt' && next.beltState && !next.beltState.item) {
        next.beltState.item = { id: uuid(), type: 'I', progress: 0 }
        ms.outputReady = false
        ms.processingTicks = MACHINE_PROCESS_TICKS
      }
      continue
    }

    // If processing, count down
    if (ms.processingTicks > 0) {
      ms.processingTicks--
      if (ms.processingTicks === 0) {
        ms.outputReady = true
      }
      continue
    }

    // Idle: start processing if powered and have energy
    if (isPowered && resources.energy >= MACHINE_ENERGY_COST) {
      resources.energy -= MACHINE_ENERGY_COST
      ms.processingTicks = MACHINE_PROCESS_TICKS
    }
  }
}

function tickBelts(grid: Record<string, TileEntity>, resources: GameResources): void {
  const belts: TileEntity[] = []
  for (const entity of Object.values(grid)) {
    if (entity.type === 'belt' && entity.beltState) {
      belts.push(entity)
    }
  }

  // Belt energy cost
  const beltCost = belts.length * BELT_ENERGY_PER_TICK
  if (resources.energy >= beltCost) {
    resources.energy -= beltCost
  }

  // Pass 1: Advance all items
  for (const belt of belts) {
    if (belt.beltState!.item) {
      belt.beltState!.item.progress += BELT_SPEED
    }
  }

  // Pass 2: Transfer items that crossed the tile boundary
  for (const belt of belts) {
    const item = belt.beltState!.item
    if (!item || item.progress < 1.0) continue

    const vec = DIRECTION_VECTORS[belt.direction]
    const nextKey = `${belt.x + vec.dx},${belt.y + vec.dy}`
    const next = grid[nextKey]

    if (!next) {
      belt.beltState!.item = null
      continue
    }

    if (next.type === 'belt' && next.beltState && !next.beltState.item) {
      next.beltState.item = { ...item, progress: 0 }
      belt.beltState!.item = null
    } else if (next.type === 'storage' && next.storageState) {
      next.storageState.inventory[item.type] =
        (next.storageState.inventory[item.type] || 0) + 1
      belt.beltState!.item = null
    } else {
      item.progress = 1.0
    }
  }
}

function tickCraneArms(grid: Record<string, TileEntity>): void {
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ]

  for (const entity of Object.values(grid)) {
    if (entity.type !== 'crane_arm' || !entity.craneArmState) continue
    const cs = entity.craneArmState

    if (cs.cooldownTicks > 0) {
      cs.cooldownTicks--
      cs.isActive = false
      continue
    }

    let sourceBelt: TileEntity | null = null
    let targetStorage: TileEntity | null = null

    for (const [dx, dy] of offsets) {
      const key = `${entity.x + dx},${entity.y + dy}`
      const neighbor = grid[key]
      if (!neighbor) continue

      if (neighbor.type === 'belt' && neighbor.beltState?.item && !sourceBelt) {
        sourceBelt = neighbor
      }
      if (neighbor.type === 'storage' && neighbor.storageState && !targetStorage) {
        targetStorage = neighbor
      }
    }

    if (sourceBelt?.beltState?.item && targetStorage?.storageState) {
      const item = sourceBelt.beltState.item
      targetStorage.storageState.inventory[item.type] =
        (targetStorage.storageState.inventory[item.type] || 0) + 1
      sourceBelt.beltState.item = null
      cs.isActive = true
      cs.cooldownTicks = CRANE_COOLDOWN_TICKS
    } else {
      cs.isActive = false
    }
  }
}

function tickPromptCoal(
  grid: Record<string, TileEntity>,
  buffer: number
): number {
  if (buffer <= 0) return 0

  for (const entity of Object.values(grid)) {
    if (entity.type === 'storage' && entity.storageState) {
      entity.storageState.inventory.P += 1
      return buffer - 1
    }
  }

  return buffer
}

export const useGameStore = create<GameStore>((set, get) => ({
  grid: {},
  resources: { ...INITIAL_RESOURCES },
  camera: { x: 0, y: 0, zoom: 1 },
  tickCount: 0,
  isPaused: false,
  buildMode: null,
  buildDirection: 'right',
  promptCoalBuffer: 0,
  // FIX #3: Start with 50 iron so the user can test crafting
  playerInventory: { P: 0, I: 50, G: 0 },
  // FIX #5: Start with 5 crane arms
  playerCranes: 5,

  placeEntity: (x, y) => {
    const { buildMode, buildDirection, grid, playerCranes } = get()
    if (!buildMode || buildMode === 'delete') return

    const key = `${x},${y}`
    if (grid[key]) return // occupied

    // Crane arm consumes from player crane inventory
    if (buildMode === 'crane_arm') {
      if (playerCranes <= 0) return
      const entity: TileEntity = {
        id: uuid(),
        type: buildMode,
        x,
        y,
        direction: buildDirection,
        ...createEntityState(buildMode)
      }
      set((state) => ({
        grid: { ...state.grid, [key]: entity },
        playerCranes: state.playerCranes - 1
      }))
      return
    }

    const entity: TileEntity = {
      id: uuid(),
      type: buildMode,
      x,
      y,
      direction: buildDirection,
      ...createEntityState(buildMode)
    }

    set((state) => ({
      grid: { ...state.grid, [key]: entity }
    }))
  },

  removeEntity: (x, y) => {
    const key = `${x},${y}`
    set((state) => {
      const entity = state.grid[key]
      const newGrid = { ...state.grid }
      delete newGrid[key]
      // Return crane arms to inventory on delete
      if (entity?.type === 'crane_arm') {
        return { grid: newGrid, playerCranes: state.playerCranes + 1 }
      }
      return { grid: newGrid }
    })
  },

  setBuildMode: (mode) => set({ buildMode: mode }),

  rotateBuildDirection: () => {
    set((state) => {
      const idx = DIRECTION_ORDER.indexOf(state.buildDirection)
      return { buildDirection: DIRECTION_ORDER[(idx + 1) % 4] }
    })
  },

  setCamera: (partial) =>
    set((state) => ({ camera: { ...state.camera, ...partial } })),

  addCredits: (amount) =>
    set((state) => ({
      resources: {
        ...state.resources,
        credits: state.resources.credits + amount,
        energy: state.resources.energy + Math.floor(amount * 0.5)
      }
    })),

  spawnPromptCoal: (count) =>
    set((state) => ({
      promptCoalBuffer: state.promptCoalBuffer + count
    })),

  getEntityAt: (x, y) => {
    return get().grid[`${x},${y}`]
  },

  updateCraftingSlot: (entityId, slotIndex, item) => {
    set((state) => {
      const newGrid = { ...state.grid }
      const entity = Object.values(newGrid).find((e) => e.id === entityId)
      if (!entity?.craftingState) return state

      const newSlots = [...entity.craftingState.inputSlots]
      newSlots[slotIndex] = item
      entity.craftingState = {
        ...entity.craftingState,
        inputSlots: newSlots,
        outputSlot: matchRecipe(newSlots)
      }

      return { grid: newGrid }
    })
  },

  collectCraftingOutput: (entityId) => {
    set((state) => {
      const newGrid = { ...state.grid }
      const entity = Object.values(newGrid).find((e) => e.id === entityId)
      if (!entity?.craftingState?.outputSlot) return state

      const output = entity.craftingState.outputSlot
      const newInventory = { ...state.playerInventory }
      newInventory[output.type] = (newInventory[output.type] || 0) + output.count

      // If crafted a gear, add to player inventory
      // If recipe system later produces crane_arm, add to playerCranes
      let newCranes = state.playerCranes
      // (crane_arm crafting would go here once the recipe supports it)

      entity.craftingState = {
        inputSlots: [null, null, null, null],
        outputSlot: null
      }

      return { grid: newGrid, playerInventory: newInventory, playerCranes: newCranes }
    })
  },

  tick: () => {
    const state = get()
    if (state.isPaused) return

    const newGrid: Record<string, TileEntity> = {}
    for (const [key, entity] of Object.entries(state.grid)) {
      newGrid[key] = {
        ...entity,
        beltState: entity.beltState
          ? { item: entity.beltState.item ? { ...entity.beltState.item } : null }
          : undefined,
        machineState: entity.machineState ? { ...entity.machineState } : undefined,
        storageState: entity.storageState
          ? { inventory: { ...entity.storageState.inventory } }
          : undefined,
        craneArmState: entity.craneArmState ? { ...entity.craneArmState } : undefined,
        craftingState: entity.craftingState
          ? {
              inputSlots: [...entity.craftingState.inputSlots],
              outputSlot: entity.craftingState.outputSlot
                ? { ...entity.craftingState.outputSlot }
                : null
            }
          : undefined
      }
    }

    const newResources = { ...state.resources }

    tickGenerators(newGrid, newResources)
    tickMachines(newGrid, newResources)
    tickBelts(newGrid, newResources)
    tickCraneArms(newGrid)

    const newBuffer = tickPromptCoal(newGrid, state.promptCoalBuffer)

    newResources.credits += 0.01

    set({
      grid: newGrid,
      resources: newResources,
      tickCount: state.tickCount + 1,
      promptCoalBuffer: newBuffer
    })
  },

  reset: () =>
    set({
      grid: {},
      resources: { ...INITIAL_RESOURCES },
      tickCount: 0,
      isPaused: false,
      promptCoalBuffer: 0,
      playerInventory: { P: 0, I: 50, G: 0 },
      playerCranes: 5
    })
}))
