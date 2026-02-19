import { useState } from 'react'
import { PopupShell } from './PopupShell'
import { useAiStore } from '../../stores/ai-store'
import { useGameStore } from '../../stores/game-store'
import { useUiStore } from '../../stores/ui-store'
import type { PopupConfig, PromptResponse } from '../../types/ai'

export function PromptPopup({ popup }: { popup: PopupConfig }): React.ReactElement {
  const [prompt, setPrompt] = useState('')
  const { activeModelId, setLastGrade, setProcessing, isProcessing, createConversation, addMessage } =
    useAiStore()
  const addCredits = useGameStore((s) => s.addCredits)
  const spawnPromptCoal = useGameStore((s) => s.spawnPromptCoal)
  const openPopup = useUiStore((s) => s.openPopup)
  const closePopup = useUiStore((s) => s.closePopup)

  const handleSubmit = async (): Promise<void> => {
    if (!prompt.trim() || isProcessing) return

    setProcessing(true)

    // Ensure we have a conversation
    let convId = useAiStore.getState().activeConversationId
    if (!convId) {
      convId = createConversation()
    }

    // Add user message
    addMessage(convId, { role: 'user', content: prompt })

    try {
      const result: PromptResponse = await window.api.ai.submitPrompt(prompt, activeModelId)

      // Add assistant response
      addMessage(convId, { role: 'assistant', content: result.response })

      // Update grade, credits, and spawn prompt coal
      setLastGrade(result.grade)
      addCredits(result.grade.credits)
      const coalCount = Math.max(1, Math.floor(result.grade.credits / 10))
      spawnPromptCoal(coalCount)

      // Open response popup
      openPopup({
        type: 'response',
        title: `Response (${result.grade.tier} - ${result.grade.score}/100)`,
        position: { x: popup.position.x + 30, y: popup.position.y + 30 },
        data: { response: result.response, grade: result.grade }
      })

      // Close this prompt popup
      closePopup(popup.id)
    } catch (err) {
      console.error('Failed to submit prompt:', err)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <PopupShell popup={popup}>
      <div className="space-y-3">
        <div className="text-xs text-slate-400">
          Model: <span className="text-indigo-400">{activeModelId}</span>
        </div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt... (Better prompts = more game credits!)"
          className="w-full h-32 bg-slate-800/80 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              handleSubmit()
            }
          }}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">Ctrl+Enter to submit</span>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isProcessing ? 'Grading...' : 'Submit'}
          </button>
        </div>
      </div>
    </PopupShell>
  )
}
