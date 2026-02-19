import { useState } from 'react'
import { PopupShell } from './PopupShell'
import { useGameStore } from '../../stores/game-store'
import { RECIPES } from '../../game/recipes'
import type { PopupConfig } from '../../types/ai'
import { ITEM_COLORS } from '../../types/game'
import type { ItemType, TileEntity } from '../../types/game'

const ITEM_NAMES: Record<ItemType, string> = {
  P: 'Prompt Coal',
  I: 'Iron',
  G: 'Gear'
}

const OUTPUT_DISPLAY: Record<string, { label: string; color: string }> = {
  P: { label: 'P', color: ITEM_COLORS.P },
  I: { label: 'I', color: ITEM_COLORS.I },
  G: { label: 'G', color: ITEM_COLORS.G },
  CRANE: { label: 'Crane', color: '#dc2626' }
}

const ALL_ITEMS: ItemType[] = ['P', 'I', 'G']

/**
 * Find all storage entities within 1-tile radius (8 surrounding tiles)
 * of the given crafting table entity.
 */
function getNearbyStorage(
  grid: Record<string, TileEntity>,
  craftingEntity: TileEntity
): TileEntity[] {
  const offsets = [
    [-1, -1], [0, -1], [1, -1],
    [-1, 0],           [1, 0],
    [-1, 1],  [0, 1],  [1, 1]
  ]
  const result: TileEntity[] = []
  for (const [dx, dy] of offsets) {
    const key = `${craftingEntity.x + dx},${craftingEntity.y + dy}`
    const neighbor = grid[key]
    if (neighbor?.type === 'storage' && neighbor.storageState) {
      result.push(neighbor)
    }
  }
  return result
}

/**
 * Aggregate inventory across multiple storage entities.
 */
function aggregateInventory(storages: TileEntity[]): Record<ItemType, number> {
  const total: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
  for (const s of storages) {
    if (s.storageState) {
      for (const [k, v] of Object.entries(s.storageState.inventory)) {
        total[k as ItemType] += v
      }
    }
  }
  return total
}

/**
 * Item Picker sub-popup: shows when clicking an empty crafting slot.
 * Lists all item types available from nearby storage bins.
 */
function ItemPicker({
  available,
  usedInSlots,
  onPick,
  onClose,
  position
}: {
  available: Record<ItemType, number>
  usedInSlots: Record<ItemType, number>
  onPick: (item: ItemType) => void
  onClose: () => void
  position: { x: number; y: number }
}): React.ReactElement {
  const hasAny = ALL_ITEMS.some((t) => (available[t] - (usedInSlots[t] || 0)) > 0)

  return (
    <div
      className="absolute z-50 bg-slate-800 border border-slate-500 rounded-lg shadow-xl p-2 min-w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      <div className="text-xs text-slate-400 mb-2 px-1 flex items-center justify-between">
        <span>Select item from storage</span>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300 text-xs ml-2"
        >
          x
        </button>
      </div>
      {!hasAny ? (
        <div className="text-xs text-slate-500 px-1 py-2">
          No items in nearby storage bins.
          <br />
          <span className="text-slate-600">Place a storage box within 1 tile of this crafting table.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {ALL_ITEMS.map((itemType) => {
            const count = available[itemType] - (usedInSlots[itemType] || 0)
            const disabled = count <= 0
            return (
              <button
                key={itemType}
                onClick={() => !disabled && onPick(itemType)}
                disabled={disabled}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${
                  disabled
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-slate-700 cursor-pointer'
                }`}
              >
                <span
                  className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-slate-900"
                  style={{ backgroundColor: disabled ? '#475569' : ITEM_COLORS[itemType] }}
                >
                  {itemType}
                </span>
                <span className="text-slate-300">{ITEM_NAMES[itemType]}</span>
                <span className="ml-auto text-xs text-slate-400">x{Math.max(0, count)}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function CraftingPopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  const entityId = popup.data.entityId as string
  const grid = useGameStore((s) => s.grid)
  const updateCraftingSlot = useGameStore((s) => s.updateCraftingSlot)
  const collectCraftingOutput = useGameStore((s) => s.collectCraftingOutput)

  // Track which slot has its item picker open, and the click position
  const [pickerSlot, setPickerSlot] = useState<number | null>(null)
  const [pickerPos, setPickerPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  const entity = Object.values(grid).find((e) => e.id === entityId)
  const craftingState = entity?.craftingState

  if (!craftingState || !entity) {
    return (
      <PopupShell popup={popup} width={440}>
        <div className="text-sm text-slate-500">Crafting table not found.</div>
      </PopupShell>
    )
  }

  // Only aggregate storage within 1-tile radius
  const nearbyStorage = getNearbyStorage(grid, entity)
  const totalStorage = aggregateInventory(nearbyStorage)

  // Count items used in current slots
  const usedInSlots: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
  for (const slot of craftingState.inputSlots) {
    if (slot) usedInSlots[slot]++
  }

  const handleSlotClick = (index: number, e: React.MouseEvent): void => {
    const current = craftingState.inputSlots[index]

    if (current) {
      // Clear the slot
      updateCraftingSlot(entityId, index, null)
      setPickerSlot(null)
      return
    }

    // Open item picker sub-popup at click position (relative to crafting popup)
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setPickerPos({ x: rect.right - rect.left + 8, y: 0 })
    setPickerSlot(index)
  }

  const handleItemPick = (item: ItemType): void => {
    if (pickerSlot !== null) {
      updateCraftingSlot(entityId, pickerSlot, item)
      setPickerSlot(null)
    }
  }

  const handleCollect = (): void => {
    if (!craftingState.outputSlot) return
    collectCraftingOutput(entityId)
  }

  const noNearbyStorage = nearbyStorage.length === 0

  return (
    <PopupShell popup={popup} width={440}>
      <div className="space-y-4 relative">
        <div className="text-xs text-slate-400">
          Click empty slot to pick an item. Click filled slot to clear it.
        </div>

        {noNearbyStorage && (
          <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/40 rounded px-2 py-1.5">
            No storage boxes adjacent to this crafting table.
            Place a storage box within 1 tile to access items.
          </div>
        )}

        <div className="flex items-center gap-6 justify-center">
          {/* 2x2 Input Grid */}
          <div className="grid grid-cols-2 gap-1.5 relative">
            {craftingState.inputSlots.map((slot, i) => (
              <button
                key={i}
                onClick={(e) => handleSlotClick(i, e)}
                className="w-14 h-14 rounded-lg border-2 border-slate-600 bg-slate-800/80 flex items-center justify-center text-lg font-bold transition-colors hover:border-slate-400"
                style={
                  slot
                    ? { backgroundColor: ITEM_COLORS[slot] + '40', borderColor: ITEM_COLORS[slot] }
                    : undefined
                }
              >
                {slot ? (
                  <span style={{ color: ITEM_COLORS[slot] }}>{slot}</span>
                ) : (
                  <span className="text-slate-600 text-sm">+</span>
                )}
              </button>
            ))}

            {/* Item picker sub-popup */}
            {pickerSlot !== null && (
              <ItemPicker
                available={totalStorage}
                usedInSlots={usedInSlots}
                onPick={handleItemPick}
                onClose={() => setPickerSlot(null)}
                position={pickerPos}
              />
            )}
          </div>

          {/* Arrow */}
          <div className="text-slate-500 text-2xl">→</div>

          {/* Output Slot */}
          <button
            onClick={handleCollect}
            disabled={!craftingState.outputSlot}
            className={`w-14 h-14 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
              craftingState.outputSlot
                ? 'border-emerald-500 bg-emerald-900/30 hover:bg-emerald-800/40 cursor-pointer'
                : 'border-slate-700 bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            {craftingState.outputSlot ? (
              <>
                <span
                  className="text-lg font-bold"
                  style={{ color: OUTPUT_DISPLAY[craftingState.outputSlot.type]?.color || '#22c55e' }}
                >
                  {OUTPUT_DISPLAY[craftingState.outputSlot.type]?.label || craftingState.outputSlot.type}
                </span>
                {craftingState.outputSlot.count > 1 && (
                  <span className="text-xs text-slate-400">x{craftingState.outputSlot.count}</span>
                )}
              </>
            ) : (
              <span className="text-sm">?</span>
            )}
          </button>
        </div>

        {/* Nearby Storage Summary */}
        <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
          <div className="mb-1">
            Nearby storage ({nearbyStorage.length} bin{nearbyStorage.length !== 1 ? 's' : ''}):
          </div>
          <div className="flex gap-3">
            {(Object.entries(totalStorage) as [ItemType, number][]).map(([type, count]) => (
              <span key={type} style={{ color: ITEM_COLORS[type] }}>
                {ITEM_NAMES[type]}: {count - (usedInSlots[type] || 0)}
              </span>
            ))}
          </div>
        </div>

        {/* Recipe Reference */}
        <div className="text-xs text-slate-600 border-t border-slate-700/50 pt-2">
          <div className="mb-1 text-slate-500">Recipes:</div>
          {RECIPES.map((recipe, i) => {
            const outDisplay = OUTPUT_DISPLAY[recipe.output.type]
            return (
              <div key={i} className="text-slate-500 mb-0.5">
                <span style={{ color: outDisplay?.color || '#888' }}>
                  {outDisplay?.label || recipe.output.type}
                </span>
                {' '}= {recipe.label}
              </div>
            )
          })}
        </div>
      </div>
    </PopupShell>
  )
}
