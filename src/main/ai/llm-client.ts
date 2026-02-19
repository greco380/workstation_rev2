import { net } from 'electron'

export async function callLLM(
  provider: string,
  apiKey: string,
  modelId: string,
  prompt: string
): Promise<string> {
  if (provider === 'Anthropic') {
    return callAnthropic(apiKey, modelId, prompt)
  }
  if (provider === 'OpenAI') {
    return callOpenAI(apiKey, modelId, prompt)
  }
  throw new Error(`Unknown provider: ${provider}`)
}

async function callAnthropic(apiKey: string, modelId: string, prompt: string): Promise<string> {
  const response = await net.fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Anthropic API error ${response.status}: ${text}`)
  }

  const data = await response.json()
  return data.content?.[0]?.text ?? 'No response content'
}

async function callOpenAI(apiKey: string, modelId: string, prompt: string): Promise<string> {
  const response = await net.fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024
    })
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`OpenAI API error ${response.status}: ${text}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? 'No response content'
}
