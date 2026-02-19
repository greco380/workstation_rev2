import { useRef, useCallback, useState, type ReactNode } from 'react'
import { useUiStore } from '../../stores/ui-store'
import type { PopupConfig } from '../../types/ai'

interface PopupShellProps {
  popup: PopupConfig
  children: ReactNode
  width?: number
}

export function PopupShell({ popup, children, width = 500 }: PopupShellProps): React.ReactElement {
  const closePopup = useUiStore((s) => s.closePopup)
  const updatePosition = useUiStore((s) => s.updatePopupPosition)

  const [pos, setPos] = useState(popup.position)
  const isDragging = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input, textarea, select')) return
      isDragging.current = true
      dragOffset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }

      const handleMove = (ev: MouseEvent): void => {
        if (!isDragging.current) return
        const newX = ev.clientX - dragOffset.current.x
        const newY = ev.clientY - dragOffset.current.y
        setPos({ x: newX, y: newY })
      }

      const handleUp = (): void => {
        isDragging.current = false
        updatePosition(popup.id, pos.x, pos.y)
        window.removeEventListener('mousemove', handleMove)
        window.removeEventListener('mouseup', handleUp)
      }

      window.addEventListener('mousemove', handleMove)
      window.addEventListener('mouseup', handleUp)
    },
    [pos, popup.id, updatePosition]
  )

  return (
    <div
      className="absolute pointer-events-auto"
      style={{ left: pos.x, top: pos.y, width }}
    >
      <div className="bg-slate-900/95 border border-slate-600 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden">
        {/* Title bar */}
        <div
          className="flex items-center justify-between px-4 py-2 bg-slate-800/80 cursor-move select-none"
          onMouseDown={handleDragStart}
        >
          <span className="text-sm font-medium text-slate-200">{popup.title}</span>
          <button
            onClick={() => closePopup(popup.id)}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            x
          </button>
        </div>

        {/* Content */}
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}
