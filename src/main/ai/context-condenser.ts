export interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

/**
 * Condenses a conversation history into a summary for context transfer.
 * For MVP this is a simple extraction — later can use AI summarization.
 */
export function condenseContext(messages: Message[]): string {
  if (messages.length === 0) return ''

  const userMessages = messages.filter((m) => m.role === 'user')
  const assistantMessages = messages.filter((m) => m.role === 'assistant')

  const topics = userMessages
    .slice(-5) // last 5 user messages
    .map((m) => m.content.slice(0, 200))
    .join(' | ')

  const lastAssistant = assistantMessages.at(-1)
  const lastContext = lastAssistant ? lastAssistant.content.slice(0, 500) : ''

  return [
    'Previous conversation summary:',
    `Topics discussed: ${topics}`,
    lastContext ? `Last response context: ${lastContext}` : ''
  ]
    .filter(Boolean)
    .join('\n')
}
