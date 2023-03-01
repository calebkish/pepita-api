import { NutrientViewModel } from "../models/nutrient-view-model";
import { sortNutrients } from "./sort-nutrients";

  export function aggregateNutrients(nutrients: NutrientViewModel[], sort: boolean = true): NutrientViewModel[] {
    const nutrientsEntries: [string, NutrientViewModel][] = nutrients
      .map(foodWithNutrition => [foodWithNutrition.nutrientId, foodWithNutrition]);

    const aggregateNutrients = nutrientsEntries
      .reduce((prev, [id, nutrient]) => {
        prev[id] ??= { ...nutrient, amount: 0 };
        prev[id].amount += nutrient.amount;
        return prev;
      }, {} as Record<string, NutrientViewModel> );

    return sort
      ? Object.values(aggregateNutrients).sort(sortNutrients)
      : Object.values(aggregateNutrients);
  }
