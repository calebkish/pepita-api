export function normalizeFoodCategory(foodCategory: string) {
  return foodCategory
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, ' ');
}

