import { useGameStore } from '../stores/game-store'
import { useUiStore } from '../stores/ui-store'
import { ENTITY_COLORS } from '../types/game'
import type { EntityType } from '../types/game'

interface ToolSlot {
  mode: EntityType | 'delete' | null
  label: string
  shortcut: string
  color: string // entity color from game
  textColor: string
}

const TOOLS: ToolSlot[] = [
  { mode: null, label: 'Select', shortcut: 'Esc', color: '#334155', textColor: '#94a3b8' },
  { mode: 'belt', label: 'Belt', shortcut: '1', color: ENTITY_COLORS.belt, textColor: '#fef3c7' },
  { mode: 'machine', label: 'Mach', shortcut: '2', color: ENTITY_COLORS.machine, textColor: '#c7d2fe' },
  { mode: 'generator', label: 'Gen', shortcut: '3', color: ENTITY_COLORS.generator, textColor: '#d1fae5' },
  { mode: 'storage', label: 'Store', shortcut: '4', color: ENTITY_COLORS.storage, textColor: '#e2e8f0' },
  { mode: 'crafting_table', label: 'Craft', shortcut: '5', color: ENTITY_COLORS.crafting_table, textColor: '#e9d5ff' },
  { mode: 'crane_arm', label: 'Crane', shortcut: '6', color: ENTITY_COLORS.crane_arm, textColor: '#fecaca' },
  { mode: 'delete', label: 'Del', shortcut: 'X', color: '#7f1d1d', textColor: '#fca5a5' }
]

export function Toolbar(): React.ReactElement {
  const buildMode = useGameStore((s) => s.buildMode)
  const buildDirection = useGameStore((s) => s.buildDirection)
  const playerCranes = useGameStore((s) => s.playerCranes)
  const playerInventory = useGameStore((s) => s.playerInventory)
  const setBuildMode = useGameStore((s) => s.setBuildMode)
  const rotateBuildDirection = useGameStore((s) => s.rotateBuildDirection)
  const openPopup = useUiStore((s) => s.openPopup)

  const handleNewPrompt = (): void => {
    openPopup({
      type: 'prompt',
      title: 'New Prompt',
      position: { x: window.innerWidth / 2 - 250, y: window.innerHeight / 2 - 200 },
      data: {}
    })
  }

  // Direction indicator character
  const dirArrow: Record<string, string> = { up: '↑', right: '→', down: '↓', left: '←' }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-end gap-2">
      {/* Minecraft-style hotbar */}
      <div
        className="flex items-center gap-0 p-1 rounded-lg backdrop-blur-sm"
        style={{ background: 'rgba(15, 23, 42, 0.85)', border: '2px solid #475569' }}
      >
        {TOOLS.map((tool, i) => {
          const isActive = buildMode === tool.mode
          const isCrane = tool.mode === 'crane_arm'

          return (
            <button
              key={tool.mode ?? 'select'}
              onClick={() => setBuildMode(tool.mode)}
              title={`${tool.label} (${tool.shortcut})`}
              className="relative flex flex-col items-center justify-center transition-all"
              style={{
                width: 52,
                height: 52,
                background: isActive ? tool.color : `${tool.color}44`,
                border: isActive ? '2px solid #e2e8f0' : '2px solid #33415580',
                borderRadius: 4,
                margin: '0 1px',
                boxShadow: isActive ? '0 0 8px rgba(255,255,255,0.2)' : 'none'
              }}
            >
              {/* Label inside the square */}
              <span
                className="text-xs font-bold leading-none"
                style={{ color: isActive ? '#fff' : tool.textColor, opacity: isActive ? 1 : 0.8 }}
              >
                {tool.label}
              </span>

              {/* Shortcut number - bottom right corner */}
              <span
                className="absolute text-[9px] font-mono"
                style={{ bottom: 2, right: 3, color: '#64748b' }}
              >
                {tool.shortcut}
              </span>

              {/* Crane count badge */}
              {isCrane && (
                <span
                  className="absolute text-[9px] font-bold"
                  style={{ top: 2, right: 3, color: '#fbbf24' }}
                >
                  {playerCranes}
                </span>
              )}
            </button>
          )
        })}

        {/* Divider */}
        <div className="w-px h-10 mx-1" style={{ background: '#475569' }} />

        {/* Rotate button - same tile style */}
        <button
          onClick={rotateBuildDirection}
          title="Rotate (R)"
          className="flex flex-col items-center justify-center"
          style={{
            width: 52,
            height: 52,
            background: '#1e293b',
            border: '2px solid #33415580',
            borderRadius: 4
          }}
        >
          <span className="text-lg leading-none" style={{ color: '#94a3b8' }}>
            {dirArrow[buildDirection]}
          </span>
          <span className="text-[9px]" style={{ color: '#64748b' }}>
            R
          </span>
        </button>
      </div>

      {/* Prompt button */}
      <button
        onClick={handleNewPrompt}
        className="text-white px-4 py-3 rounded-lg text-sm font-medium backdrop-blur-sm transition-colors"
        style={{
          background: 'rgba(79, 70, 229, 0.9)',
          border: '2px solid rgba(129, 140, 248, 0.4)'
        }}
      >
        New Prompt
      </button>
    </div>
  )
}
