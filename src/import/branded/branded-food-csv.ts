import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

import * as csv from 'csv';

import { baseUnitAmount, createUnitsAndGetFoodUnitInputs } from '../util/food-units.js';
import { Food, FoodBrand, FoodCategory, FoodUnit, NutrientsOnFoods } from '@prisma/client';
import { toUUID } from '../util/to-uuid.js';
import { createNutrients } from '../util/create-nutrients.js';
import { normalizeFoodCategory } from '../util/normalize-food-category.js';
import { Csv } from '../util/csv.js';
import { CsvNutrient } from '../util/supporting-types.js';
import { toTitleCase } from '../util/to-title-case.js';
import { normalizeFoodBrand } from '../util/normalize-food-brand.js';

// =============================================================================

interface CsvInputBrandedFood {
  fdc_id: string;
  serving_size: string;
  serving_size_unit: string;
  branded_food_category: string;
  brand_owner: string;
  household_serving_fulltext?: string;
  gtin_upc: string;
  description: string;
}

interface CsvInputFoodNutrient {
  fdc_id: string;
  nutrient_id: string; // like '1003', '1008', etc.
  amount: string; // in grams
}

// =============================================================================

type CsvOutputFood = Omit<Food, 'created'> & { created: string };

type CsvOutputFoodUnit = Omit<FoodUnit, 'created' | 'servingSizeAmount' | 'baseUnitAmountRatio' | 'foodUnitAmount'> & {
  created: string
  servingSizeAmount: number;
  baseUnitAmountRatio: number;
  foodUnitAmount: number;
};

type CsvOutputFoodNutrient = Omit<NutrientsOnFoods, 'created' | 'amount'> & {
  amount: number;
};

// =============================================================================

const { weightFoodUnitInputs, volumeFoodUnitInputs, allUnitsOnDb } = await createUnitsAndGetFoodUnitInputs();
const nutrientsOnDb = await createNutrients();

const inputNutrientCsvPath = path.join('src', 'import', 'data', 'supporting', 'nutrient.csv');
const nutrientCsv = new Csv<CsvNutrient>(inputNutrientCsvPath);

const createdTimestamp = '2023-02-14 00:00:00.000';

const inputBrandedFoodCsvPath = path.join('src', 'import', 'data', 'branded', 'exports', 'latest_branded_food.csv');
const inputFoodCategoryCsvPath = path.join('src', 'import', 'data', 'branded', 'exports', 'branded_food_category.csv');
const inputFoodBrandCsvPath = path.join('src', 'import', 'data', 'branded', 'exports', 'branded_food_brand_owner.csv');
const inputFoodNutrientCsvPath = path.join('src', 'import', 'data', 'branded', 'exports', 'food_nutrient.csv');


const csvOutputFolder = path.join('src', 'import', 'data', 'branded', 'postgres-copy');

// =============================================================================

const emptyCategory = 'Uncategorized';

await processBrandedFoodCsv();


async function processBrandedFoodCsv(): Promise<void> {



  const outputFoodCategoryCsvFileName = 'food-category.csv';
  console.log(`creating ${outputFoodCategoryCsvFileName}`);
  await pipeline(
    fs.createReadStream(inputFoodCategoryCsvPath),
    csv.parse({ columns: true }),
    csv.transform((fdcFood: { branded_food_category: string }) => {
      const foodCategory = normalizeFoodCategory(fdcFood.branded_food_category);

      if (!foodCategory) {
        return {
          name: emptyCategory,
          id: toUUID(emptyCategory),
        };
      }

      const foodCategoryId = toUUID(foodCategory);
      const newRow: FoodCategory = {
        id: foodCategoryId,
        name: foodCategory,
      };
      return newRow;
    }),
    csv.stringify({ quoted: true, header: true }),
    fs.createWriteStream(path.join(csvOutputFolder, outputFoodCategoryCsvFileName)),
  );
  console.log(`created ${outputFoodCategoryCsvFileName}`);


  const outputFoodBrandCsvFileName = 'food-brand.csv';
  console.log(`creating ${outputFoodBrandCsvFileName}`);
  await pipeline(
    fs.createReadStream(inputFoodBrandCsvPath),
    csv.parse({ columns: true }),
    csv.transform((brand: { brand_owner: string }) => {

      if (toUUID(brand.brand_owner) === '656d41aa-86fe-f8a1-ecb9-796853e3a74d') {
        console.log(brand.brand_owner);
      }

      const foodBrand = normalizeFoodBrand(brand.brand_owner);

      if (!foodBrand) return;

      const newRow: FoodBrand = {
        id: toUUID(brand.brand_owner),
        name: toTitleCase(foodBrand),
      };
      return newRow;
    }),
    csv.stringify({ quoted: true, header: true }),
    fs.createWriteStream(path.join(csvOutputFolder, outputFoodBrandCsvFileName)),
  );
  console.log(`created ${outputFoodBrandCsvFileName}`);



  const outputFoodCsvFileName = 'food.csv';
  console.log(`creating ${outputFoodCsvFileName}`);
  await pipeline(
    fs.createReadStream(inputBrandedFoodCsvPath),
    csv.parse({ columns: true }),
    csv.transform((fdcFood: CsvInputBrandedFood) => {
      const newFoodId = toUUID(fdcFood.fdc_id);
      const foodCategory = normalizeFoodCategory(fdcFood.branded_food_category);
      const foodCategoryId = !!foodCategory
        ? toUUID(foodCategory)
        : toUUID(emptyCategory);

      const newFood: CsvOutputFood = {
        id: newFoodId,
        created: createdTimestamp,
        name: toTitleCase(fdcFood.description),
        accountId: '',
        fdcId: Number(fdcFood.fdc_id),
        foodCategoryId: foodCategoryId,
        source: 'usda:branded_food',
        baseUnit: fdcFood.serving_size_unit,
        baseUnitAmount: baseUnitAmount as unknown as Food['baseUnitAmount'],
        foodBrandId: normalizeFoodBrand(fdcFood.brand_owner) ? toUUID(fdcFood.brand_owner) : null,
      };

      return newFood;
    }),
    csv.stringify({ quoted: true, header: true }),
    fs.createWriteStream(path.join(csvOutputFolder, outputFoodCsvFileName)),
  );
  console.log(`created ${outputFoodCsvFileName}`);



  const outputFoodUnitCsvFileName = 'food-unit.csv';
  console.log(`creating ${outputFoodUnitCsvFileName}`);
  await pipeline(
    fs.createReadStream(inputBrandedFoodCsvPath),
    csv.parse({ columns: true }),
    csv.transform((fdcFood: CsvInputBrandedFood) => {

      const foodId = toUUID(fdcFood.fdc_id);

      const foodUnits: CsvOutputFoodUnit[] = [
        {
          id: crypto.randomUUID(),
          created: createdTimestamp,
          name: fdcFood.household_serving_fulltext ? `serving (${fdcFood.household_serving_fulltext})` : 'serving',
          abbreviation: 'serv',
          foodId,
          unitId: '',
          eighths: false,
          fourths: false,
          halves: false,
          sixteenths: false,
          sixths: false,
          thirds: false,
          servingSizeAmount: 1,
          baseUnitAmountRatio: Number(fdcFood.serving_size) / baseUnitAmount,
          foodUnitAmount: Number(fdcFood.serving_size),
        },
      ];

      if (fdcFood.serving_size_unit === 'g') {
        foodUnits.push(...weightFoodUnitInputs.map(unit => ({
          ...unit,
          foodId,
          created: createdTimestamp,
          id: crypto.randomUUID(),
          unitId: '',
        })));
      } else if (fdcFood.serving_size_unit === 'ml') {
        foodUnits.push(...volumeFoodUnitInputs.map(unit => ({
          ...unit,
          foodId,
          created: createdTimestamp,
          id: crypto.randomUUID(),
          unitId: '',
        })));
      }

      return foodUnits.map(foodUnit => ({
        id: foodUnit.id,
        created: foodUnit.created,
        name: foodUnit.name,
        abbreviation: foodUnit.abbreviation,
        foodId: foodUnit.foodId,
        unitId: foodUnit.unitId,
        eighths: foodUnit.eighths.toString(),
        fourths: foodUnit.fourths.toString(),
        halves: foodUnit.halves.toString(),
        sixteenths: foodUnit.sixteenths.toString(),
        sixths: foodUnit.sixths.toString(),
        thirds: foodUnit.thirds.toString(),
        servingSizeAmount: 1,
        baseUnitAmountRatio: foodUnit.baseUnitAmountRatio,
        foodUnitAmount: foodUnit.foodUnitAmount,
      }));

    }),
    new Transform({
      objectMode: true,
      transform(chunk: any[], _, callback) {
        chunk.forEach(chunk => this.push(chunk));
        callback();
      },
    }),
    csv.stringify({ quoted: true, header: true }),
    fs.createWriteStream(path.join(csvOutputFolder, outputFoodUnitCsvFileName)),
  );
  console.log(`created ${outputFoodUnitCsvFileName}`);



  const outputFoodNutrientCsvFileName = 'food-nutrient.csv';
  console.log(`creating ${outputFoodNutrientCsvFileName}`);
  await pipeline(
    // We assume the input CSV has filtered out nutrients we don't care about.
    fs.createReadStream(inputFoodNutrientCsvPath),
    csv.parse({ columns: true }),
    csv.transform((fdcNutrient: CsvInputFoodNutrient) => {
      const foodId = toUUID(fdcNutrient.fdc_id);
      const nutrientOnSupportingCsv = nutrientCsv.rows
        .find(nutrientRow => nutrientRow.id === fdcNutrient.nutrient_id);

      if (!nutrientOnSupportingCsv) {
        console.error(`Could not find nutrient row on supporting csv with id ${fdcNutrient.nutrient_id}`);
        return;
      }

      const unitOnDb = allUnitsOnDb
        .find(unit => unit.abbreviation === nutrientOnSupportingCsv.unit_name.toLowerCase());
      if (!unitOnDb) {
        console.error(`Could not find unit on DB w/ abbreviation ${nutrientOnSupportingCsv.unit_name}`);
        return;
      }

      const foodNutrient: CsvOutputFoodNutrient = {
        nutrientId: toUUID(fdcNutrient.nutrient_id),
        foodId,
        amount: Number(fdcNutrient.amount),
        unitId: unitOnDb.id,
      };

      return foodNutrient;
    }),
    csv.stringify({ quoted: true, header: true }),
    fs.createWriteStream(path.join(csvOutputFolder, outputFoodNutrientCsvFileName)),
  );
  console.log(`created ${outputFoodNutrientCsvFileName}`);
}

