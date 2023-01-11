import { prismaClient } from '../db.js';

import * as fs from 'fs';
import * as path from 'path';

type TransactionOperation = 'break' | 'continue' | undefined;

const dataPath = path.join('src', 'import', 'data', 'sr-legacy-oct-2021.json');
const text = fs.readFileSync(dataPath, { encoding: 'utf-8' });
const data = JSON.parse(text);

const units = [
  {
    abbreviation: 'IU',
    name: 'international unit',
  },
  {
    abbreviation: 'mg',
    name: 'milligrams',
  },
  {
    abbreviation: 'μg',
    name: 'micrograms',
  },
  {
    abbreviation: 'g',
    name: 'gram',
  },
  {
    abbreviation: 'kcal',
    name: 'calories',
  },

  {
    abbreviation: 'oz',
    name: 'ounce',
  },
  {
    abbreviation: 'tbsp',
    name: 'tablespoon',
    halves: true,
    fourths: true,
    eighths: true,
  },
  {
    abbreviation: 'tsp',
    name: 'teaspoon',
    halves: true,
    fourths: true,
    eighths: true,
  },
  {
    abbreviation: 'lb',
    name: 'pound',
    halves: true,
    fourths: true,
    eighths: true,
  },
  {
    abbreviation: 'fl oz',
    name: 'fluid ounce',
  },
  {
    abbreviation: 'cup',
    name: 'cup',
    halves: true,
    thirds: true,
    fourths: true,
  },
  {
    abbreviation: 'pt',
    name: 'pint',
    halves: true,
  },
  {
    abbreviation: 'qt',
    name: 'quart',
    halves: true,
  },
  {
    abbreviation: 'gal',
    name: 'gallon',
    halves: true,
    fourths: true,
  },
];

for (const unit of units) {
  const { abbreviation, name, halves = false, fourths = false, thirds = false, eighths = false } = unit;
  await prismaClient.unit.upsert({
    where: {
      abbreviation,
    },
    create: {
      abbreviation,
      name,
      halves,
      fourths,
      thirds,
      eighths
    },
    update: {},
  });
}


for (const fdcFood of data.SRLegacyFoods) {
  fs.writeFileSync(
    path.join('src', 'import', 'temp', 'sr-legacy-food.json'),
    JSON.stringify(fdcFood, null, 2),
    { encoding: 'utf-8'}
  );

  const operation: TransactionOperation = await prismaClient.$transaction(async (tx) => {

    const doesFoodExist = (await tx.food.findUnique({
      where: {
        fdcId: fdcFood.fdcId
      }
    })) !== null;


    if (doesFoodExist) {
      return 'continue';
    }

    const baseGramWeight = 100; // assume USDA always uses 100 grams

    // ## `Food` ##
    const food = await tx.food.create({
      data: {
        name: fdcFood.description,
        gramWeight: baseGramWeight,
        source: 'usda',
        usdaDataType: fdcFood.dataType,
        fdcId: fdcFood.fdcId,
        foodCategory: {
          connectOrCreate: {
            where: {
              name: fdcFood.foodCategory.description,
            },
            create: {
              name: fdcFood.foodCategory.description,
            },
          }
        },
      }
    });

    // ## `FoodUnit` ##
    for (const portion of fdcFood.foodPortions) {
      // Try and find a unit based on `portion.modifier`
      const unit = await tx.unit.findUnique({
        where: {
          abbreviation: portion.modifier,
        },
      });

      const unitToGramRatio = portion.gramWeight / baseGramWeight;

      await tx.foodUnit.upsert({
        where: {
          id: food.id,
        },
        create: {
          name: unit?.name ?? portion.modifier,
          abbreviation: unit?.abbreviation ?? portion.modifier,
          halves: unit?.halves ?? false,
          thirds: unit?.thirds ?? false,
          fourths: unit?.fourths ?? false,
          sixths: unit?.sixths ?? false,
          eighths: unit?.eighths ?? false,
          sixteenths: unit?.sixteenths ?? false,
          unitToGramRatio,
          foodId: food.id,
        },
        update: {},
      });
    }

    // ## `NutrientsOnFoods` ##
    const validNutrientIds = [
      1003, // protein
      1008, // carbohydrates by difference
      1008, // kcal
      1004, // total lipid (fat)
      1079, // fiber
      1051, // water
      1092, // potassium
      1089, // iron
      1087, // calcium
      1063, // sugars, total NLEA
      1093, // sodium
      1013, // lactose
      1012, // fructose
      1007, // ash
      1009, // starch
    ];

    for (const n of fdcFood.foodNutrients) {
      if (!validNutrientIds.includes(n.nutrient.id)) {
        continue;
      }

      const unit = await tx.unit.findUnique({
        where: {
          abbreviation: n.nutrient.unitName
        }
      });

      if (!unit) {
        throw new Error(`Could not find unit w/ abbreviation ${n.nutrient.unitName}`);
      }

      const nutrient = await tx.nutrient.upsert({
        where: {
          name: n.nutrient.name,
        },
        create: {
          name: n.nutrient.name,
          fdcNutrientId: n.nutrient.id,
        },
        update: {},
      });

      await tx.nutrientsOnFoods.create({
        data: {
          nutrientId: nutrient.id,
          unitId: unit.id,
          foodId: food.id,
          amount: n.amount,
        },
      });
    }
  });

  // if (operation === 'break') break;
  // else continue;
}
