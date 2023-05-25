import * as fs from 'fs';
import * as path from 'path';

import { parse } from 'csv-parse/sync';

import { prismaClient } from '../../src/db.js';
import { toUUID } from '../util/to-uuid.js';
import { createUnitsAndGetFoodUnitInputs } from '../util/food-units.js';
import { createNutrients } from '../util/create-nutrients.js';
import { FoodUnit, Prisma } from '@prisma/client';

type TransactionOperation = 'break' | 'continue' | undefined | void;

interface CsvFood {
  fdc_id: string;
  description: string;
  food_code: string;
}

interface CsvFoodNutrient {
  nutrient_id: string;
  name: string;
  unit_name: string;
  amount: string;
  food_code: string;
  fdc_id: string;
  id: string;
}

interface CsvFoodPortion {
  fdc_id: string;
  food_code: string;
  portion_description: string;
  gram_weight: string;
}

class Csv<T = any> {
  rowArrs: string[][];
  headers: string[];
  rows: T[];

  constructor(path: string) {
    const text = fs.readFileSync(path, { encoding: 'utf-8' });

    const rows = parse(text, { columns: true });
    this.rows = rows;
  }

}

const dataPath = path.join('import', 'data', 'fndds');

const foodCsv = new Csv<CsvFood>(path.join(dataPath, 'exports', 'FoodExport.csv'));
const foodNutrientCsv = new Csv<CsvFoodNutrient>(path.join(dataPath, 'exports', 'NutrientsOnFoodsExport.csv'));
const foodPortionsCsv = new Csv<CsvFoodPortion>(path.join(dataPath, 'exports', 'FoodUnitExport.csv'));

const nutrientsOnDb = await createNutrients();

const { weightFoodUnitInputs, allUnitsOnDb } = await createUnitsAndGetFoodUnitInputs();

// the first row is the headers
// const limited = foodCsv.rows.slice(1, 99);

for (const fdcFood of foodCsv.rows) {
  console.log(fdcFood.fdc_id);

  const operation: TransactionOperation = await prismaClient.$transaction(async (tx) => {

    if (Number.isNaN(Number(fdcFood.fdc_id))) {
      throw new Error(`fdcFood.fdc_id of ${fdcFood.fdc_id} wasn't a number!`);
    }

    const doesFoodExist = (await tx.food.findUnique({
      where: {
        id: toUUID(fdcFood.food_code),
      }
    })) !== null;


    if (doesFoodExist) {
      return 'continue';
    }

    const baseGramWeight = 100; // assume USDA always uses 100 grams

    // ## Food ##
    const food = await tx.food.create({
      data: {
        id: toUUID(fdcFood.food_code),
        name: fdcFood.description,
        indexedName: fdcFood.description,
        baseUnitAmount: baseGramWeight,
        baseUnit: 'g',
        source: 'fndds',
        sourceUniqueId: fdcFood.food_code,
        sourceImportDate: new Date(2022, 9, 28),
      },
    });

    // ## FoodUnit ##
    const foodPortions = foodPortionsCsv.rows
      .filter(row => {
        return (
          row.fdc_id === fdcFood.fdc_id &&
          row.portion_description !== 'Quantity not specified'
        );
      });


    const cupPattern = /1 cup.*/;
    const cupFoodPortion = foodPortions.find(row => {
      return cupPattern.test(row.portion_description);
    });

    let volumeFoodUnits: Prisma.FoodUnitCreateManyInput[] = [];
    if (cupFoodPortion) {
      const grams = Number(cupFoodPortion.gram_weight);
      const gramsInMl = grams * 0.004226753;
      const volumeUnitsAssociations = getVolumeUnitAssociations(gramsInMl);

      volumeFoodUnits.push(...volumeUnitsAssociations.map(vua => {
        return {
          name: vua.abbreviation,
          servingSizeAmount: 1,
          abbreviation: vua.abbreviation,
          halves: false,
          thirds: false,
          fourths: false,
          sixths: false,
          eighths: false,
          sixteenths: false,
          baseUnitAmountRatio: Number(vua.grams) / baseGramWeight,
          foodUnitAmount: Number(vua.grams),
          foodId: food.id,
        }
      }));
    }

    const flOzPattern = /1 fl oz.*/;
    const flOzFoodPortion = foodPortions.find(row => {
      return flOzPattern.test(row.portion_description);
    });

    if (volumeFoodUnits.length === 0 && flOzFoodPortion) {
      const grams = Number(flOzFoodPortion.gram_weight);
      const gramsInMl = grams * 0.03381402;
      const volumeUnitsAssociations = getVolumeUnitAssociations(gramsInMl);

      volumeFoodUnits.push(...volumeUnitsAssociations.map(vua => {
        return {
          name: vua.abbreviation,
          servingSizeAmount: 1,
          abbreviation: vua.abbreviation,
          halves: false,
          thirds: false,
          fourths: false,
          sixths: false,
          eighths: false,
          sixteenths: false,
          baseUnitAmountRatio: Number(vua.grams) / baseGramWeight,
          foodUnitAmount: Number(vua.grams),
          foodId: food.id,
        }
      }));
    }

    // const originalPortions: Prisma.FoodUnitCreateManyInput[] = foodPortions.map(portion => {
    //   const pattern = /^\s*(?<amount>\d{1,2}) (?<name>.*)$/;
    //   const matches = pattern.exec(portion.portion_description);
    //   const amount = matches?.groups?.['amount'];
    //   const name = matches?.groups?.['name'];
    //   return {
    //     name: name ?? portion.portion_description,
    //     servingSizeAmount: amount && !Number.isNaN(Number(amount)) ? Number(amount) : 1,
    //     abbreviation: name ?? portion.portion_description,
    //     halves: false,
    //     thirds: false,
    //     fourths: false,
    //     sixths: false,
    //     eighths: false,
    //     sixteenths: false,
    //     baseUnitAmountRatio: Number(portion.gram_weight) / baseGramWeight,
    //     foodUnitAmount: Number(portion.gram_weight),
    //     foodId: food.id,
    //   };
    // });
    const weightPortions: Prisma.FoodUnitCreateManyInput[] = weightFoodUnitInputs.map((foodUnit) => {
      return {
        ...foodUnit,
        foodId: food.id,
      };
    });
    const allFoodUnitsToCreate: Prisma.FoodUnitCreateManyInput[] = [...volumeFoodUnits, ...weightPortions];

    await tx.foodUnit.createMany({ data: allFoodUnitsToCreate });




    // ## NutrientsOnFoods ##
    const filteredNutrients = foodNutrientCsv.rows.filter(fn => fn.food_code === fdcFood.food_code);
    await tx.nutrientsOnFoods.createMany({
      data: filteredNutrients.map(foodNutrientOnCsv => {
        const nutrientOnDb = nutrientsOnDb.find(n => n.fdcNutrientId === Number(foodNutrientOnCsv.id))!;
        const nutrientUnitAbbreviation = foodNutrientOnCsv.unit_name.toLowerCase();
        const unitOnDb = allUnitsOnDb.find(u => u.abbreviation === nutrientUnitAbbreviation)!;

        return {
          nutrientId: nutrientOnDb.id,
          unitId: unitOnDb.id,
          foodId: food.id,
          amount: foodNutrientOnCsv.amount,
        };
      }),
    });
  });

  // @ts-ignore
  if (operation === 'break') break;
  else continue;
}


function getVolumeUnitAssociations(gramsInMl: number) {
  const volumeUnitsAssociations = [
    {
      abbreviation: 'mL',
      grams: gramsInMl * 1,
    },
    {
      abbreviation: 'L',
      grams: gramsInMl * 1000, // relative to 1 mL
    },
    {
      abbreviation: 'tsp',
      grams: gramsInMl * 4.92892, // relative to 1 mL
    },
    {
      abbreviation: 'tbsp',
      grams: gramsInMl * 14.7868, // relative to 1 mL
    },
    {
      abbreviation: 'fl oz',
      grams: gramsInMl * 29.5735, // relative to 1 mL
    },
    {
      abbreviation: 'cup',
      grams: gramsInMl * 236.5882, // relative to 1 mL
    },
    {
      abbreviation: 'qt',
      grams: gramsInMl * 946.353, // relative to 1 mL
    },
    {
      abbreviation: 'pt',
      grams: gramsInMl * 473.1765, // relative to 1 mL
    },
    {
      abbreviation: 'gal',
      grams: gramsInMl * 3785.412, // relative to 1 mL
    },
  ];
  return volumeUnitsAssociations;
}
