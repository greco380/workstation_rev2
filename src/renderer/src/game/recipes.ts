import type { ItemType } from '../types/game'

export interface CraftingRecipe {
  ingredients: ItemType[]
  output: { type: ItemType; count: number }
  label: string
}

export const RECIPES: CraftingRecipe[] = [
  {
    // 4x Iron -> 1 Gear
    ingredients: ['I', 'I', 'I', 'I'],
    output: { type: 'G', count: 1 },
    label: '4 Iron -> 1 Gear'
  },
  // Crane arm recipe: 2 Iron + 2 Gear -> 1 Crane Arm
  // (crane_arm is not an ItemType on belts, so this will be handled
  //  via playerInventory directly. For now, gear is the main craftable.)
]

/**
 * Match a 2x2 crafting grid against recipes.
 * Orientation-independent: just counts items regardless of slot position.
 */
export function matchRecipe(
  slots: (ItemType | null)[]
): { type: ItemType; count: number } | null {
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
