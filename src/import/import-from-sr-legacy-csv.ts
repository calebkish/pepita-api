import { prismaClient } from '../db.js';

import * as fs from 'fs';
import * as path from 'path';

type TransactionOperation = 'break' | 'continue' | undefined;

interface CsvFood {
  fdc_id: string;
  data_type: string;
  description: string;
  food_category_id: string;
}

interface CsvFoodNutrient {
  id: string;
  fdc_id: string;
  nutrient_id: string;
  amount: string;
  data_points: string;
  derivation_id: string;
  min: string;
  max: string;
  median: string;
  footnote: string;
}

interface CsvNutrient {
  id: string;
  name: string;
  unit_name: string;
  nutrient_nbr: string;
  rank: string;
}

interface CsvFoodCategory {
  id: string;
  code: string;
  description: string;
}

interface CsvFoodPortion {
  id: string;
  fdc_id: string;
  seq_num: string;
  amount: string;
  measure_unit_id: string;
  portion_description: string;
  modifier: string;
  gram_weight: string;
  data_points: string;
  footnote: string;
  min_year_acquired: string;
}

class Csv<T = any> {
  rowArrs: string[][];
  headers: string[];
  rows: T[];

  constructor(path: string) {
    const text = fs.readFileSync(path, { encoding: 'utf-8' });
    this.rowArrs = text.split('\n').map(row => {
      const trimmedRow = row.replace(/^"/, '').replace(/"$/, '');
      const columns = trimmedRow.split('","').map(column => {
        return column;
      });
      return columns;
    });
    this.headers = this.rowArrs[0];
    this.rows = this.rowArrs.map((rowArr: any) => {
      const row: Record<string, string> = {};
      for (let i=0; i < this.headers.length; i++) {
        row[this.headers[i]] = rowArr[i];
      }
      return row;
    }) as T[];
  }

}

const foodCsv = new Csv<CsvFood>(path.join('src', 'import', 'data', 'sr-legacy', 'food.csv'));
const foodNutrientCsv = new Csv<CsvFoodNutrient>(path.join('src', 'import', 'data', 'sr-legacy', 'food_nutrient.csv'));
const nutrientCsv = new Csv<CsvNutrient>(path.join('src', 'import', 'data', 'sr-legacy', 'supporting', 'nutrient.csv'));
const foodCategoryCsv = new Csv<CsvFoodCategory>(path.join('src', 'import', 'data', 'sr-legacy', 'supporting', 'food_category.csv'));
const foodPortionsCsv = new Csv<CsvFoodPortion>(path.join('src', 'import', 'data', 'sr-legacy', 'food_portion.csv'));

// name -> CsvFood.description
// gramWeight -> 100
// source -> 'usda'
// usdaDataType -> 'sr_legacy_food'

await createBaseUnits();

// the first row is the headers
const limited = foodCsv.rows.slice(1, 99);

for (const fdcFood of limited) {
  const operation: TransactionOperation = await prismaClient.$transaction(async (tx) => {
    console.log('FOOD', fdcFood.description);

    if (Number(fdcFood.fdc_id) === NaN) {
      throw new Error(`fdcFood.fdc_id of ${fdcFood.fdc_id} wasn't a number!`);
    }

    const doesFoodExist = (await tx.food.findUnique({
      where: {
        fdcId: Number(fdcFood.fdc_id),
      }
    })) !== null;


    if (doesFoodExist) {
      return 'continue';
    }

    const baseGramWeight = 100; // assume USDA always uses 100 grams

    const foodCategory = foodCategoryCsv.rows
      .find(row => row.id === fdcFood.food_category_id);

    // ## `Food` ##
    const food = await tx.food.create({
      data: {
        name: fdcFood.description,
        gramWeight: baseGramWeight,
        source: 'usda',
        usdaDataType: fdcFood.data_type,
        fdcId: Number(fdcFood.fdc_id),
        ...(foodCategory
          ? {
            foodCategory: {
              connectOrCreate: {
                where: { name: foodCategory.description, },
                create: { name: foodCategory.description, },
              }
            },
          }
          : {}
        ),
      }
    });

    const foodPortions = foodPortionsCsv.rows
      .filter(row => row.fdc_id === fdcFood.fdc_id);

    // ## `FoodUnit` ##
    for (const portion of foodPortions) {
      // Try and find a unit based on `portion.modifier`
      const unit = await tx.unit.findUnique({
        where: {
          abbreviation: portion.modifier,
        },
      });

      if (Number(portion.gram_weight) === NaN) {
        throw new Error(`portion.gram_weight of ${portion.gram_weight} wasn't a number!`);
      }

      if (Number(portion.amount) === NaN) {
        throw new Error(`portion.amount of ${portion.amount} wasn't a number!`);
      }

      await tx.foodUnit.create({
        data: {
          name: unit?.name ?? portion.modifier,
          abbreviation: unit?.abbreviation ?? portion.modifier,
          halves: unit?.halves ?? false,
          thirds: unit?.thirds ?? false,
          fourths: unit?.fourths ?? false,
          sixths: unit?.sixths ?? false,
          eighths: unit?.eighths ?? false,
          sixteenths: unit?.sixteenths ?? false,
          unitToGramRatio: Number(portion.gram_weight) / baseGramWeight,
          foodId: food.id,
          gramWeight: Number(portion.gram_weight),
          servingSizeAmount: Number(portion.amount),
        },
      });
    }


    // Also create a `FoodUnit` for grams
    await tx.foodUnit.create({
      data: {
        name: 'gram',
        abbreviation: 'g',
        unitToGramRatio: 1,
        foodId: food.id,
        gramWeight: baseGramWeight,
        servingSizeAmount: baseGramWeight,
      },
    });


    // ## `NutrientsOnFoods` ##
    const validNutrientIds = [
      '1003', // protein
      '1005', // carbohydrates by difference
      '1008', // kcal
      '1004', // total lipid (fat)
      '1079', // fiber
      '1051', // water
      '1092', // potassium
      '1089', // iron
      '1087', // calcium
      '1063', // sugars, total NLEA
      '1093', // sodium
      '1013', // lactose
      '1012', // fructose
      '1007', // ash
      '1009', // starch
    ];

    const filteredNutrients = foodNutrientCsv.rows.filter(foodNutrient => foodNutrient.fdc_id === fdcFood.fdc_id);
    for (const foodNutrientOnCsv of filteredNutrients) {
      if (!validNutrientIds.includes(foodNutrientOnCsv.nutrient_id)) {
        continue;
      }

      const nutrientOnCsv = nutrientCsv.rows
        .find(nutrient => nutrient.id === foodNutrientOnCsv.nutrient_id);

      if (!nutrientOnCsv) {
        console.error(`Couldn't find nutrient with id ${foodNutrientOnCsv.nutrient_id}`);
        return 'continue';
      }

      const nutrientUnitAbbreviation = nutrientOnCsv.unit_name.toLowerCase();
      const unitOnDb = await tx.unit.findUnique({
        where: {
          abbreviation: nutrientUnitAbbreviation,
        }
      });

      if (!unitOnDb) {
        throw new Error(`Could not find unit w/ abbreviation ${nutrientUnitAbbreviation}`);
      }


      if (Number(nutrientOnCsv.id) === NaN) {
        throw new Error(`nutrient.id of ${nutrientOnCsv.id} wasn't a number!`);
      }

      const nutrientOnDb = await tx.nutrient.upsert({
        where: {
          name: nutrientOnCsv.name,
        },
        create: {
          name: nutrientOnCsv.name,
          fdcNutrientId: Number(nutrientOnCsv.id),
        },
        update: {},
      });

      // console.log('NUTRIENT:', nutrientOnDb);

      // console.log('PAIR:', nutrientOnDb.id, food.id, nutrientOnCsv.id, fdcFood.fdc_id);
      await tx.nutrientsOnFoods.create({
        data: {
          nutrientId: nutrientOnDb.id,
          unitId: unitOnDb.id,
          foodId: food.id,
          amount: foodNutrientOnCsv.amount,
        },
      });
    }
  });

  // @ts-ignore
  if (operation === 'break') break;
  else continue;
}


async function createBaseUnits() {
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
}

