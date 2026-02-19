import { useGameStore } from '../stores/game-store'
import { useAiStore } from '../stores/ai-store'
import { ITEM_COLORS } from '../types/game'
import type { ItemType } from '../types/game'

const TIER_COLORS: Record<string, string> = {
  S: 'text-yellow-400',
  A: 'text-emerald-400',
  B: 'text-blue-400',
  C: 'text-slate-300',
  D: 'text-orange-400',
  F: 'text-red-400'
}

const ITEM_NAMES: Record<ItemType, string> = {
  P: 'Coal',
  I: 'Iron',
  G: 'Gear'
}

export function ResourceBar(): React.ReactElement {
  const resources = useGameStore((s) => s.resources)
  const grid = useGameStore((s) => s.grid)
  const playerCranes = useGameStore((s) => s.playerCranes)
  const lastGrade = useAiStore((s) => s.lastGrade)

  // Unified inventory: sum all storage bin contents
  const totalItems: Record<ItemType, number> = { P: 0, I: 0, G: 0 }
  for (const entity of Object.values(grid)) {
    if (entity.type === 'storage' && entity.storageState) {
      for (const [k, v] of Object.entries(entity.storageState.inventory)) {
        totalItems[k as ItemType] += v
      }
    }
  }

  return (
    <div className="absolute top-3 right-3 z-50 flex items-center gap-3">
      {/* Last grade badge */}
      {lastGrade && (
        <div
          className={`bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-2 backdrop-blur-sm ${TIER_COLORS[lastGrade.tier]}`}
        >
          <div className="text-xs text-slate-400">Last Grade</div>
          <div className="text-lg font-bold">
            {lastGrade.tier} ({lastGrade.score})
          </div>
        </div>
      )}

      {/* Resources */}
      <div className="bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-2 backdrop-blur-sm text-sm">
        <div className="flex items-center gap-4">
          <div className="text-amber-400" title="Credits">
            <span className="text-xs text-slate-400 mr-1">Credits</span>
            {Math.floor(resources.credits)}
          </div>
          <div className="text-cyan-400" title="Energy">
            <span className="text-xs text-slate-400 mr-1">Energy</span>
            {resources.energy.toFixed(1)}
          </div>
        </div>
        {/* Unified storage totals */}
        <div className="flex items-center gap-3 mt-1">
          {(Object.entries(totalItems) as [ItemType, number][]).map(([type, count]) => (
            <span key={type} className="text-xs" style={{ color: ITEM_COLORS[type] }}>
              {ITEM_NAMES[type]}: {count}
            </span>
          ))}
          {playerCranes > 0 && (
            <span className="text-xs text-red-400">
              Cranes: {playerCranes}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
