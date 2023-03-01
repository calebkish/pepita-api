export function normalizeFoodBrand(foodBrand: string) {
  return foodBrand
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, ' ');
}
