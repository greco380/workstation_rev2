import { useState } from 'react'
import { PopupShell } from './PopupShell'
import { useAiStore } from '../../stores/ai-store'
import type { PopupConfig } from '../../types/ai'

export function ApiKeyPopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  const [key, setKey] = useState('')
  const [saved, setSaved] = useState(false)
  const models = useAiStore((s) => s.models)
  const activeModelId = useAiStore((s) => s.activeModelId)

  const activeModel = models.find((m) => m.id === activeModelId)
  const provider = activeModel?.provider || 'Unknown'

  const handleSave = async (): Promise<void> => {
    if (!key.trim()) return
    await window.api.ai.setApiKey(provider, key.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <PopupShell popup={popup} width={420}>
      <div className="space-y-3">
        <div className="text-xs text-slate-400">
          Provider: <span className="text-indigo-400">{provider}</span>
        </div>
        <div className="text-xs text-slate-500">
          Enter your API key for {provider}. Keys are stored in memory only and not persisted.
        </div>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder={`${provider} API key...`}
          className="w-full bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave()
          }}
        />
        <div className="flex items-center justify-between">
          {saved ? (
            <span className="text-xs text-emerald-400">Key saved!</span>
          ) : (
            <span className="text-xs text-slate-500">Press Enter to save</span>
          )}
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Save Key
          </button>
        </div>
      </div>
    </PopupShell>
  )
}
