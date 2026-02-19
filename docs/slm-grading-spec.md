# SLM Prompt Grading Specification

## Overview

This document specifies the requirements for a Small Language Model (SLM) that will replace the heuristic prompt grader in the Workstation application. The SLM evaluates user prompts to AI systems and produces a quality score that translates into in-game credits.

## Purpose

The grading system is the core game mechanic. Better prompts earn more credits, which power the factory simulation. The SLM must:
1. Accurately distinguish between low-effort and high-quality prompts
2. Provide actionable feedback to help users improve their prompting skills
3. Run fast enough to not disrupt the user experience

## Input Format

```json
{
  "prompt": "string — the user's raw prompt text (1-5000 characters)",
  "model_id": "string — target model identifier (e.g. 'claude-sonnet-4')",
  "context": "string — optional previous conversation summary (0-2000 characters)"
}
```

The `model_id` provides context for what kind of prompt is appropriate (e.g., coding prompts for a code model, creative prompts for a writing model). The `context` field is optional and provides prior conversation state.

## Output Format

```json
{
  "score": 72,
  "feedback": "Good structure with clear constraints. Try adding specific examples to push into A-tier."
}
```

| Field | Type | Description |
|-------|------|-------------|
| `score` | integer 0-100 | Overall prompt quality score |
| `feedback` | string (10-150 chars) | 1-2 sentence actionable feedback |

## Score-to-Tier Mapping

| Score Range | Tier | Credit Multiplier | Description |
|-------------|------|-------------------|-------------|
| 90-100 | S | 5.0x | Exceptional — detailed, specific, well-structured, creative |
| 75-89  | A | 3.0x | Strong — covers most quality dimensions well |
| 60-74  | B | 2.0x | Good — clear intent with some specificity |
| 40-59  | C | 1.5x | Adequate — basic instruction with room for improvement |
| 20-39  | D | 1.0x | Weak — vague or too brief |
| 0-19   | F | 0.5x | Poor — extremely short, unclear, or nonsensical |

Credits formula: `credits = score * multiplier`

Example: score 85 (A tier) = 85 * 3.0 = 255 credits

## Evaluation Dimensions

The SLM should implicitly learn to evaluate these dimensions (they don't need to appear in output, but should influence scoring):

### 1. Clarity & Detail
- Is the prompt sufficiently detailed to produce a useful response?
- Does word count and information density match the complexity of the request?
- Scoring guide: 5-word prompts score low; 50-100 word prompts with context score high; extremely long unfocused prompts score moderately

### 2. Specificity
- Does the prompt use concrete terms, named technologies, numbers, or specific references?
- Are requirements stated precisely rather than vaguely?
- Red flags: "something", "stuff", "whatever", "make it good"
- Green flags: specific names, versions, quantities, file paths, error messages

### 3. Structure
- Does the prompt have clear instruction verbs (create, analyze, compare, implement)?
- Are there enumerated steps, bullet points, or organized sections?
- Are constraints and requirements explicit (must, should, must not, maximum, minimum)?
- Is the expected output format specified?

### 4. Creativity & Depth
- Does the prompt consider edge cases or failure modes?
- Does it ask for alternatives, trade-offs, or comparisons?
- Does it provide examples of desired output?
- Does it ask for reasoning or explanation of approach?

## Training Data Requirements

### Volume
- Minimum: 10,000 labeled prompt-score-feedback triples
- Recommended: 25,000+ for robust generalization

### Schema per Sample

```json
{
  "prompt": "Implement a rate limiter in Python using the token bucket algorithm. It should support configurable rate and burst size. Include unit tests.",
  "score": 78,
  "feedback": "Clear specification with good technical detail. Consider adding edge case requirements (concurrent access, error handling) for S-tier.",
  "breakdown": {
    "clarity": 20,
    "specificity": 22,
    "structure": 18,
    "creativity": 18
  },
  "domain": "coding",
  "model_target": "claude-sonnet-4"
}
```

The `breakdown` field provides per-dimension training signal but is not required in SLM output. Include it in training data for richer supervision.

### Domain Distribution

| Domain | Percentage | Examples |
|--------|-----------|----------|
| Coding/Engineering | 30% | "Implement a REST API...", "Debug this error..." |
| Analysis/Research | 20% | "Compare these approaches...", "Analyze this data..." |
| Writing/Creative | 20% | "Write a blog post about...", "Draft an email..." |
| Explanation/Teaching | 15% | "Explain how X works...", "Why does Y happen..." |
| Task/Planning | 15% | "Create a project plan...", "Organize these items..." |

### Tier Distribution

| Tier | Percentage | Notes |
|------|-----------|-------|
| F (0-19) | 10% | Very short, unclear, single-word prompts |
| D (20-39) | 15% | Brief, vague, lacking context |
| C (40-59) | 25% | Adequate prompts with basic structure |
| B (60-74) | 25% | Good prompts with clear intent |
| A (75-89) | 15% | Strong prompts with specificity |
| S (90-100) | 10% | Exceptional, comprehensive prompts |

### Data Sources to Investigate

- Public prompt datasets (ShareGPT, LMSYS Chatbot Arena)
- Prompt engineering courses/examples (graded by structure)
- Synthetic generation: use a large LLM to both write prompts at various quality levels and grade them
- Human annotation: hire annotators to grade a seed set, then use active learning

### Annotation Guidelines

Annotators should score prompts on the 0-100 scale considering:
1. Would an AI model produce a significantly better response with this prompt vs. a minimal version?
2. How much thinking/effort did the prompt author invest?
3. Would an expert prompt engineer approve of this prompt?

Inter-annotator agreement target: Cohen's kappa >= 0.7

## Model Requirements

### Performance
- **Accuracy**: Mean Absolute Error < 8 points vs. human judges
- **Rank correlation**: Spearman's rho >= 0.85 between predicted and human scores
- **Feedback relevance**: >80% of feedback rated "helpful" by human evaluators

### Latency
- Target: < 100ms inference on consumer hardware
- Maximum acceptable: 200ms
- Environment: Electron main process (Node.js runtime)

### Size
- Target: < 50MB quantized model weights
- Maximum: 100MB
- Format: ONNX (preferred) or TensorFlow Lite

### Architecture Suggestions
- Fine-tuned distilled model (e.g., DistilBERT, TinyLlama, Phi-2-mini)
- Alternatively: fine-tuned classifier head on a small encoder model
- Regression head for score + generation head for feedback (multi-task)

## Deployment

### Runtime
- ONNX Runtime for Node.js (`onnxruntime-node`)
- Loaded once at app startup, runs in Electron main process
- Inference called from `src/main/ai/prompt-grader.ts`

### Fallback
- If SLM fails to load or inference errors: fall back to existing heuristic grader
- Heuristic grader remains in codebase as `gradePromptHeuristic()`

### Integration Point

```typescript
// src/main/ai/prompt-grader.ts
export async function gradePrompt(prompt: string, modelId?: string): Promise<GradeResult> {
  try {
    const { score, feedback } = await slmGrade(prompt, modelId)
    const { tier, multiplier } = getTier(score)
    return { score, tier, credits: Math.round(score * multiplier), feedback, breakdown: null }
  } catch {
    return gradePromptHeuristic(prompt)  // fallback
  }
}
```

## Current Heuristic Grader (Reference)

The existing heuristic grader in `src/main/ai/prompt-grader.ts` uses regex pattern matching across four dimensions (25 points each):

**Length (0-25)**: Word count brackets (< 5 words = 2pts, 60-119 words = 25pts)

**Specificity (0-25)**: +5 each for proper nouns, tech keywords, numbers, quoted terms, requirement words. -3 for vague words ("something", "stuff").

**Structure (0-25)**: Base 5 + action verbs (+5) + bullet points (+5) + constraints (+5) + context (+3) + output format (+2)

**Creativity (0-25)**: Base 5 + edge cases (+5) + alternatives (+5) + multi-part (+3) + examples (+4) + reasoning (+3)

This heuristic should be used as a baseline for training data validation — SLM scores should roughly correlate with heuristic scores (Pearson r >= 0.7) while being more nuanced.
