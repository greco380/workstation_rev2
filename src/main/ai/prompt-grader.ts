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

const TIER_THRESHOLDS: { min: number; tier: Tier; multiplier: number }[] = [
  { min: 90, tier: 'S', multiplier: 5.0 },
  { min: 75, tier: 'A', multiplier: 3.0 },
  { min: 60, tier: 'B', multiplier: 2.0 },
  { min: 40, tier: 'C', multiplier: 1.5 },
  { min: 20, tier: 'D', multiplier: 1.0 },
  { min: 0, tier: 'F', multiplier: 0.5 }
]

function scoreLength(prompt: string): number {
  const words = prompt.trim().split(/\s+/).length
  if (words < 5) return 2
  if (words < 15) return 8
  if (words < 30) return 14
  if (words < 60) return 20
  if (words < 120) return 25
  return 22 // slightly penalize extremely long prompts
}

function scoreSpecificity(prompt: string): number {
  let score = 0
  const lower = prompt.toLowerCase()

  // Named entities, technologies, specific terms
  const specificPatterns = [
    /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/, // Proper nouns
    /\b(?:react|python|typescript|javascript|node|sql|css|html|api|json|http)\b/i,
    /\b\d+\b/, // Numbers (concrete quantities)
    /["'][^"']+["']/, // Quoted terms
    /\b(?:specifically|exactly|precisely|must|should|require)\b/i
  ]

  for (const pattern of specificPatterns) {
    if (pattern.test(prompt)) score += 5
  }

  // Penalize vague language
  const vaguePatterns = [
    /\b(?:something|stuff|things|whatever|somehow|maybe)\b/i
  ]
  for (const pattern of vaguePatterns) {
    if (pattern.test(lower)) score -= 3
  }

  return Math.max(0, Math.min(25, score))
}

function scoreStructure(prompt: string): number {
  let score = 5 // baseline

  // Has clear instruction verbs
  if (/\b(?:create|build|write|implement|design|analyze|explain|compare|list|generate|fix|refactor)\b/i.test(prompt)) {
    score += 5
  }

  // Has numbered steps or bullet points
  if (/(?:^|\n)\s*(?:\d+[.):]|\-|\*)\s/m.test(prompt)) {
    score += 5
  }

  // Has constraints or requirements
  if (/\b(?:constraint|requirement|must not|should not|ensure|make sure|limit|maximum|minimum)\b/i.test(prompt)) {
    score += 5
  }

  // Has context/background
  if (/\b(?:context|background|given that|assuming|currently|the goal is)\b/i.test(prompt)) {
    score += 3
  }

  // Has expected output format
  if (/\b(?:format|output|return|respond with|as a|in the form of)\b/i.test(prompt)) {
    score += 2
  }

  return Math.min(25, score)
}

function scoreCreativity(prompt: string): number {
  let score = 5 // baseline

  // Asks about edge cases
  if (/\b(?:edge case|corner case|what if|what about|consider|handle the case)\b/i.test(prompt)) {
    score += 5
  }

  // Asks for alternatives or comparisons
  if (/\b(?:alternative|compare|trade-?off|pros and cons|versus|vs\.?|different approach)\b/i.test(prompt)) {
    score += 5
  }

  // Multi-part question (semicolons, "also", "additionally")
  if (/\b(?:also|additionally|furthermore|moreover)\b/i.test(prompt) || prompt.includes(';')) {
    score += 3
  }

  // Provides examples
  if (/\b(?:for example|e\.g\.|such as|like this|for instance)\b/i.test(prompt)) {
    score += 4
  }

  // Asks for reasoning/explanation
  if (/\b(?:why|explain|reasoning|justify|how does|what causes)\b/i.test(prompt)) {
    score += 3
  }

  return Math.min(25, score)
}

function getTier(score: number): { tier: Tier; multiplier: number } {
  for (const t of TIER_THRESHOLDS) {
    if (score >= t.min) return { tier: t.tier, multiplier: t.multiplier }
  }
  return { tier: 'F', multiplier: 0.5 }
}

function generateFeedback(breakdown: GradeBreakdown, tier: Tier): string {
  if (tier === 'S') return 'Excellent prompt! Detailed, specific, well-structured, and creative.'

  const weakest = Object.entries(breakdown).reduce((a, b) => (a[1] < b[1] ? a : b))
  const tips: Record<string, string> = {
    length: 'Try adding more detail and context to your prompt.',
    specificity: 'Use specific names, numbers, and concrete details.',
    structure: 'Add clear instructions, steps, or constraints.',
    creativity: 'Consider edge cases, alternatives, or provide examples.'
  }

  return tips[weakest[0]] || 'Keep practicing!'
}

export function gradePrompt(prompt: string): GradeResult {
  const breakdown: GradeBreakdown = {
    length: scoreLength(prompt),
    specificity: scoreSpecificity(prompt),
    structure: scoreStructure(prompt),
    creativity: scoreCreativity(prompt)
  }

  const score = breakdown.length + breakdown.specificity + breakdown.structure + breakdown.creativity
  const { tier, multiplier } = getTier(score)
  const credits = Math.round(score * multiplier)
  const feedback = generateFeedback(breakdown, tier)

  return { score, tier, credits, breakdown, feedback }
}
