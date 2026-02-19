import { useEffect, useState, useCallback } from 'react'
import { useAiStore } from '../stores/ai-store'
import { useUiStore } from '../stores/ui-store'
import type { ModelInfo, ApiKeyStatus } from '../types/ai'

export function ModelSelector(): React.ReactElement {
  const { models, activeModelId, setModels, setActiveModel } = useAiStore()
  const openPopup = useUiStore((s) => s.openPopup)
  const [isOpen, setIsOpen] = useState(false)
  const [keyStatuses, setKeyStatuses] = useState<ApiKeyStatus[]>([])

  useEffect(() => {
    window.api.ai.getModels().then((m: ModelInfo[]) => setModels(m))
  }, [setModels])

  const refreshKeyStatus = useCallback(() => {
    window.api.ai.getApiKeyStatus().then((s: ApiKeyStatus[]) => setKeyStatuses(s))
  }, [])

  useEffect(() => {
    refreshKeyStatus()
    // Refresh every 2 seconds to pick up changes from ApiKeyPopup
    const interval = setInterval(refreshKeyStatus, 2000)
    return () => clearInterval(interval)
  }, [refreshKeyStatus])

  const activeModel = models.find((m) => m.id === activeModelId)
  const hasKey = activeModel
    ? keyStatuses.some((s) => s.provider === activeModel.provider && s.isSet)
    : false

  const handleSelect = (model: ModelInfo): void => {
    if (!model.available) return
    setActiveModel(model.id)
    setIsOpen(false)
  }

  const handleApiKey = (): void => {
    openPopup({
      type: 'api_key',
      title: 'API Key',
      position: { x: 12, y: 60 },
      data: {}
    })
  }

  return (
    <div className="absolute top-3 left-3 z-50 flex items-center gap-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-800/90 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/90 backdrop-blur-sm transition-colors"
      >
        <span
          className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-slate-500'}`}
        />
        <span>{activeModel?.name || 'Select Model'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <button
        onClick={handleApiKey}
        className={`bg-slate-800/90 border border-slate-600 rounded-lg px-2.5 py-2 text-xs backdrop-blur-sm transition-colors ${
          hasKey
            ? 'text-emerald-400 hover:bg-slate-700/90'
            : 'text-slate-400 hover:bg-slate-700/90'
        }`}
        title={hasKey ? 'API key set' : 'Add API key'}
      >
        {hasKey ? 'Key Set' : 'API Key'}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-slate-800/95 border border-slate-600 rounded-lg overflow-hidden backdrop-blur-sm shadow-xl">
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => handleSelect(model)}
              disabled={!model.available}
              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                model.id === activeModelId
                  ? 'bg-indigo-600/50 text-white'
                  : model.available
                    ? 'text-slate-300 hover:bg-slate-700/80'
                    : 'text-slate-500 cursor-not-allowed'
              }`}
            >
              <div className="font-medium">{model.name}</div>
              <div className="text-xs opacity-70">
                {model.provider} {!model.available && '(unavailable)'}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
