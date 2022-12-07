import * as fs from 'fs';
import * as path from 'path';

// ## Foundation ##

// const dataPath = path.join('src', 'import', 'foundation-oct-2022.json');
// const text = fs.readFileSync(dataPath, { encoding: 'utf-8' });
// const data = JSON.parse(text);
//
// let idk = 0;
// for (const food of data.FoundationFoods) {
//   if (food.ndbNumber) {
//     idk++;
//   }
// }
//
// console.log(idk, data.FoundationFoods.length);




// ## FNDDS ##

// const dataPath = path.join('src', 'import', 'fndds-2022.json');
// const text = fs.readFileSync(dataPath, { encoding: 'utf-8' });
// const data = JSON.parse(text);

// console.log(data.SurveyFoods.length);

// let undetermined = 0;
// let determined = 0;
// for (const food of data.SurveyFoods) {
//   const { foodPortions } = food;
//   const undet = foodPortions.filter((p: any) => p.measureUnit.name === 'undetermined' && p.measureUnit.name === 'undetermined').length;
//   const det = foodPortions.length - undet;
//   undetermined += undet;
//   determined += det;
// }




// all foodPortions in FNDDS have measureUnit.name and measureUnit.abbreviation
// set to `undetermined`.

// foodNutrients works the same way as Foundation

// There isn't really a category to use -- maybe don't use categories at all




// ## SR Legacy ##
const dataPath = path.join('src', 'import', 'sr-legacy-oct-2021.json');
const text = fs.readFileSync(dataPath, { encoding: 'utf-8' });
const data = JSON.parse(text);

// how many have just kcal
// how many have kcal and kj

// how many have just kj


// const units: Record<any, number> = {};

let total = 0;

for (const food of data.SRLegacyFoods) {
  const hasKj = food.foodNutrients.find((n: any) => n.nutrient.unitName === 'kJ');
  const hasKcal = food.foodNutrients.find((n: any) => n.nutrient.unitName === 'kcal');

  if (hasKj && !hasKcal) {
    total += 1;
  }
  // for (const nutrient of food.foodNutrients) {
  //   units[nutrient.nutrient.unitName] ??= 0;
  //   units[nutrient.nutrient.unitName] += 1;
  // }
}

// const sorted = Object.entries(units).sort((a, b) => b[1] - a[1]);

// fs.writeFileSync(
//   path.join('src', 'import', 'units-sr-legacy.json'),
//   JSON.stringify(Object.fromEntries(sorted), null, 2),
//   { encoding: 'utf-8'}
// );

console.log(total);







// ### Useful properties
// description                    name
// ndbNumber                      All foods have this property
// dataType: 'SR Legacy'          usdaDataType
// foodCategory.description       category
// foodNutrients                  Look below
// foodPortions                   Look below

// #### portion:
// abbreviation: modifier
// unitToGramWeight: gramWeight

// Always derive smaller units with larger units

// @TODO Auto-change unit based on amount
// tsp: <3 -> tbsp
// tbsp: <4 -> cup?
// oz <16 -> lb

// ### tsp -> X
// 3 tsp = 1 tbsp

// ### tbsp -> X
// 1 tbsp = 3 tsp
// 2 tbsp = 1 fl oz
// 16 tbsp = 1 cup
// 32 tbsp = 1 pint

// ### cup -> X
// 1 cup = 8 fl oz
// 1 cup = 16 tbsp
// 2 cup = 1 pint
// 4 cup = 1 quart

// ### pint -> X
// 1 pint -> 2 cup
// 2 pint -> 1 quart
// 8 pint -> 1 gallon

// ### gallon -> X
// 1 gallon -> 8 pint
// 1 gallon -> 4 quart
// 1 galoon -> 16 cup
// 1 gallon -> 128 fl oz


// Define steps for:
// 'fl oz'
// treat anything that contains 'cup' -> 'cup'
// 'tbsp'
// 'oz'
// 'lb'
// 'tsp'
// 'quart'





// #### nutrients
// nutrient.id
// nutrient.name
// nutrient.unitName
// amount

