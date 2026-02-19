import type { ElectronAPI } from '../../../preload/index'

export interface GradeBreakdown {
  length: number
  specificity: number
  structure: number
  creativity: number
}

export type Tier = 'F' | 'D' | 'C' | 'B' | 'A' | 'S'

export interface GradeResult {
  score: number
  tier: Tier
  credits: number
  breakdown: GradeBreakdown
  feedback: string
}

export interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  available: boolean
}

export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

export interface Conversation {
  id: string
  modelId: string
  messages: Message[]
  projectId: string
}

export interface PromptResponse {
  grade: GradeResult
  response: string
  modelId: string
}

export interface PopupConfig {
  id: string
  type: 'prompt' | 'response' | 'task' | 'crafting' | 'storage' | 'api_key' | 'generic'
  title: string
  position: { x: number; y: number }
  data: Record<string, unknown>
}

export type ApiProvider = 'Anthropic' | 'OpenAI'

export interface ApiKeyStatus {
  provider: string
  isSet: boolean
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
