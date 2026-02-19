export interface ModelInfo {
  id: string
  name: string
  provider: string
  description: string
  available: boolean
}

const MODELS: ModelInfo[] = [
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    description: 'Fast and capable for most tasks',
    available: true
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    description: 'Most capable for complex reasoning',
    available: true
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    description: 'Multimodal reasoning model',
    available: true
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    description: 'Fast and cost-effective',
    available: true
  },
  {
    id: 'llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    description: 'Open-source large language model',
    available: false
  }
]

export function getModels(): ModelInfo[] {
  return MODELS
}

export function getModel(id: string): ModelInfo | undefined {
  return MODELS.find((m) => m.id === id)
}
