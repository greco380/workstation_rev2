import { PopupShell } from './PopupShell'
import { useGameStore } from '../../stores/game-store'
import type { PopupConfig } from '../../types/ai'
import { ITEM_COLORS } from '../../types/game'
import type { ItemType } from '../../types/game'

const SLOT_ITEMS: ItemType[] = ['I', 'P', 'G']

export function CraftingPopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  const entityId = popup.data.entityId as string
  const grid = useGameStore((s) => s.grid)
  const updateCraftingSlot = useGameStore((s) => s.updateCraftingSlot)
  const collectCraftingOutput = useGameStore((s) => s.collectCraftingOutput)

  const entity = Object.values(grid).find((e) => e.id === entityId)
  const craftingState = entity?.craftingState

  if (!craftingState) {
    return (
      <PopupShell popup={popup} width={400}>
        <div className="text-sm text-slate-500">Crafting table not found.</div>
      </PopupShell>
    )
  }

  // Aggregate storage inventory from all nearby storage boxes
  const totalStorage: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
  for (const e of Object.values(grid)) {
    if (e.type === 'storage' && e.storageState) {
      for (const [k, v] of Object.entries(e.storageState.inventory)) {
        totalStorage[k as ItemType] += v
      }
    }
  }

  // Count items used in current slots
  const usedInSlots: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
  for (const slot of craftingState.inputSlots) {
    if (slot) usedInSlots[slot]++
  }

  const handleSlotClick = (index: number): void => {
    const current = craftingState.inputSlots[index]

    if (current) {
      // Clear the slot
      updateCraftingSlot(entityId, index, null)
      return
    }

    // Cycle through available items
    for (const itemType of SLOT_ITEMS) {
      const available = totalStorage[itemType] - (usedInSlots[itemType] || 0)
      if (available > 0) {
        updateCraftingSlot(entityId, index, itemType)
        return
      }
    }
  }

  const handleCollect = (): void => {
    if (!craftingState.outputSlot) return

    // Consume items from storage
    const consumed: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
    for (const slot of craftingState.inputSlots) {
      if (slot) consumed[slot]++
    }

    // Remove from first storage that has each item
    const gridEntities = Object.values(grid)
    for (const [itemType, count] of Object.entries(consumed)) {
      let remaining = count
      for (const e of gridEntities) {
        if (remaining <= 0) break
        if (e.type === 'storage' && e.storageState) {
          const has = e.storageState.inventory[itemType as ItemType] || 0
          const take = Math.min(has, remaining)
          e.storageState.inventory[itemType as ItemType] -= take
          remaining -= take
        }
      }
    }

    collectCraftingOutput(entityId)
  }

  return (
    <PopupShell popup={popup} width={400}>
      <div className="space-y-4">
        <div className="text-xs text-slate-400">
          Click slots to assign items. Click output to craft.
        </div>

        <div className="flex items-center gap-6 justify-center">
          {/* 2x2 Input Grid */}
          <div className="grid grid-cols-2 gap-1.5">
            {craftingState.inputSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => handleSlotClick(i)}
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
          </div>

          {/* Arrow */}
          <div className="text-slate-500 text-2xl">→</div>

          {/* Output Slot */}
          <button
            onClick={handleCollect}
            disabled={!craftingState.outputSlot}
            className={`w-14 h-14 rounded-lg border-2 flex items-center justify-center text-lg font-bold transition-all ${
              craftingState.outputSlot
                ? 'border-emerald-500 bg-emerald-900/30 text-emerald-400 hover:bg-emerald-800/40 cursor-pointer'
                : 'border-slate-700 bg-slate-800/40 text-slate-600 cursor-not-allowed'
            }`}
          >
            {craftingState.outputSlot ? (
              <span>{craftingState.outputSlot.type}</span>
            ) : (
              <span className="text-sm">?</span>
            )}
          </button>
        </div>

        {/* Available Resources */}
        <div className="text-xs text-slate-500 border-t border-slate-700 pt-2">
          <div className="mb-1">Available in storage:</div>
          <div className="flex gap-3">
            {(Object.entries(totalStorage) as [ItemType, number][]).map(([type, count]) => (
              <span key={type} style={{ color: ITEM_COLORS[type] }}>
                {type}: {count - (usedInSlots[type] || 0)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </PopupShell>
  )
}
