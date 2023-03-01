import { NutrientViewModel } from "../models/nutrient-view-model";
import { coreNutrients } from '../models/core-nutrients';

export function sortNutrients(a: NutrientViewModel, b: NutrientViewModel): number {
  const aIndex = coreNutrients.findIndex((value) => value === a.name);
  const bIndex = coreNutrients.findIndex((value) => value === b.name);

  if (aIndex === -1 && bIndex === -1) {
    return 0;
  } else if (aIndex === -1 && bIndex !== -1) {
    return 1;
  } else if (aIndex !== -1 && bIndex === -1) {
    return -1;
  } else if (aIndex === bIndex) {
    return 0;
  }

  return aIndex - bIndex;
}
