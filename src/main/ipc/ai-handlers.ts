import { ipcMain } from 'electron'
import { IPC } from '../../shared/ipc-channels'
import { gradePrompt } from '../ai/prompt-grader'
import { getModels, getModel } from '../ai/model-registry'
import { condenseContext, type Message } from '../ai/context-condenser'
import { callLLM } from '../ai/llm-client'

// In-memory API key storage (not persisted across restarts)
const apiKeys: Record<string, string> = {}

export function registerAiHandlers(): void {
  ipcMain.handle(IPC.AI.SET_API_KEY, async (_event, provider: string, key: string) => {
    apiKeys[provider] = key
    return { success: true }
  })

  ipcMain.handle(IPC.AI.GET_API_KEY_STATUS, async () => {
    return Object.keys(apiKeys).map((provider) => ({
      provider,
      isSet: apiKeys[provider].length > 0
    }))
  })

  ipcMain.handle(IPC.AI.SUBMIT_PROMPT, async (_event, prompt: string, modelId: string) => {
    const grade = gradePrompt(prompt)
    const model = getModel(modelId)
    const providerKey = model ? apiKeys[model.provider] : undefined

    let response: string
    if (providerKey && model) {
      try {
        response = await callLLM(model.provider, providerKey, modelId, prompt)
      } catch (err) {
        response = `[API Error] ${err instanceof Error ? err.message : 'Unknown error'}. Grade: ${grade.tier} (${grade.score}/100). ${grade.feedback}`
      }
    } else {
      response = `[${modelId}] Received your prompt (Grade: ${grade.tier}, Score: ${grade.score}/100). ${grade.feedback}`
    }

    return { grade, response, modelId }
  })

  ipcMain.handle(IPC.AI.GET_MODELS, async () => {
    return getModels()
  })

  ipcMain.handle(
    IPC.AI.SWITCH_MODEL,
    async (_event, newModelId: string, messages: Message[]) => {
      const condensed = condenseContext(messages)
      return { modelId: newModelId, initialContext: condensed }
    }
  )
}
