import { PopupShell } from './PopupShell'
import { useGameStore } from '../../stores/game-store'
import type { PopupConfig } from '../../types/ai'
import { ITEM_COLORS } from '../../types/game'
import type { ItemType } from '../../types/game'

const ITEM_NAMES: Record<ItemType, string> = {
  P: 'Prompt Coal',
  I: 'Iron',
  G: 'Gear'
}

export function StoragePopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  const entityId = popup.data.entityId as string
  const grid = useGameStore((s) => s.grid)
  const entity = Object.values(grid).find((e) => e.id === entityId)
  const inventory = entity?.storageState?.inventory

  return (
    <PopupShell popup={popup} width={320}>
      <div className="space-y-2">
        {!inventory ? (
          <div className="text-sm text-slate-500">Storage not found.</div>
        ) : (
          <>
            <div className="text-xs text-slate-400 mb-3">Stored Items</div>
            {(Object.entries(inventory) as [ItemType, number][]).map(([type, count]) => (
              <div
                key={type}
                className="flex items-center justify-between py-1.5 px-2 rounded bg-slate-800/60"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold text-slate-900"
                    style={{ backgroundColor: ITEM_COLORS[type] }}
                  >
                    {type}
                  </span>
                  <span className="text-sm text-slate-300">{ITEM_NAMES[type]}</span>
                </div>
                <span className="text-sm font-medium text-slate-200">{count}</span>
              </div>
            ))}
            <div className="text-xs text-slate-500 mt-2">
              Total: {Object.values(inventory).reduce((a, b) => a + b, 0)} items
            </div>
          </>
        )}
      </div>
    </PopupShell>
  )
}
