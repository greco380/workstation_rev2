import { useUiStore } from '../../stores/ui-store'
import { PromptPopup } from './PromptPopup'
import { ResponsePopup } from './ResponsePopup'
import { TaskPopup } from './TaskPopup'
import { StoragePopup } from './StoragePopup'
import { CraftingPopup } from './CraftingPopup'
import { ApiKeyPopup } from './ApiKeyPopup'
import type { PopupConfig } from '../../types/ai'

function renderPopup(popup: PopupConfig): React.ReactElement | null {
  switch (popup.type) {
    case 'prompt':
      return <PromptPopup key={popup.id} popup={popup} />
    case 'response':
      return <ResponsePopup key={popup.id} popup={popup} />
    case 'task':
      return <TaskPopup key={popup.id} popup={popup} />
    case 'storage':
      return <StoragePopup key={popup.id} popup={popup} />
    case 'crafting':
      return <CraftingPopup key={popup.id} popup={popup} />
    case 'api_key':
      return <ApiKeyPopup key={popup.id} popup={popup} />
    default:
      return null
  }
}

export function PopupManager(): React.ReactElement {
  const popups = useUiStore((s) => s.popups)

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      {popups.map((popup) => renderPopup(popup))}
    </div>
  )
}
