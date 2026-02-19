import type { ItemType, OutputType } from '../types/game'

export interface CraftingRecipe {
  ingredients: ItemType[]
  output: { type: OutputType; count: number }
  label: string
}

export const RECIPES: CraftingRecipe[] = [
  {
    // 4x Iron -> 1 Gear
    ingredients: ['I', 'I', 'I', 'I'],
    output: { type: 'G', count: 1 },
    label: '4 Iron -> 1 Gear'
  },
  {
    // 2x Iron + 2x Gear -> 1 Crane Arm
    ingredients: ['I', 'I', 'G', 'G'],
    output: { type: 'CRANE', count: 1 },
    label: '2 Iron + 2 Gear -> 1 Crane Arm'
  }
]

/**
 * Match a 2x2 crafting grid against recipes.
 * Orientation-independent: just counts items regardless of slot position.
 */
export function matchRecipe(
  slots: (ItemType | null)[]
): { type: OutputType; count: number } | null {
  const filled = slots.filter((s): s is ItemType => s !== null)
  if (filled.length !== 4) return null

  const sorted = [...filled].sort()

  for (const recipe of RECIPES) {
    const recipeSorted = [...recipe.ingredients].sort()
    if (sorted.every((item, i) => item === recipeSorted[i])) {
      return { ...recipe.output }
    }
  }

  return null
}
