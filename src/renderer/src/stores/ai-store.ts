import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type { ModelInfo, Conversation, Message, GradeResult } from '../types/ai'

interface AiStore {
  // Models
  models: ModelInfo[]
  activeModelId: string

  // Conversations
  conversations: Conversation[]
  activeConversationId: string | null

  // Last grade result (for display)
  lastGrade: GradeResult | null

  // Loading state
  isProcessing: boolean

  // Actions
  setModels: (models: ModelInfo[]) => void
  setActiveModel: (modelId: string) => void
  createConversation: (projectId?: string) => string
  addMessage: (conversationId: string, message: Omit<Message, 'timestamp'>) => void
  setLastGrade: (grade: GradeResult | null) => void
  setProcessing: (processing: boolean) => void
  getActiveConversation: () => Conversation | undefined
}

export const useAiStore = create<AiStore>((set, get) => ({
  models: [],
  activeModelId: 'claude-sonnet-4',
  conversations: [],
  activeConversationId: null,
  lastGrade: null,
  isProcessing: false,

  setModels: (models) => set({ models }),

  setActiveModel: (modelId) => set({ activeModelId: modelId }),

  createConversation: (projectId = 'default') => {
    const id = uuid()
    const conversation: Conversation = {
      id,
      modelId: get().activeModelId,
      messages: [],
      projectId
    }
    set((state) => ({
      conversations: [...state.conversations, conversation],
      activeConversationId: id
    }))
    return id
  },

  addMessage: (conversationId, message) => {
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, messages: [...c.messages, { ...message, timestamp: Date.now() }] }
          : c
      )
    }))
  },

  setLastGrade: (grade) => set({ lastGrade: grade }),

  setProcessing: (processing) => set({ isProcessing: processing }),

  getActiveConversation: () => {
    const { conversations, activeConversationId } = get()
    return conversations.find((c) => c.id === activeConversationId)
  }
}))
