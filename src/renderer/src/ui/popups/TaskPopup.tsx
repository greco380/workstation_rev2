import { PopupShell } from './PopupShell'
import type { PopupConfig } from '../../types/ai'

export function TaskPopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  return (
    <PopupShell popup={popup}>
      <div className="text-sm text-slate-300">
        <p>Task management coming soon.</p>
        <p className="text-xs text-slate-500 mt-2">
          This popup will handle task creation, status updates, and project management.
        </p>
      </div>
    </PopupShell>
  )
}
