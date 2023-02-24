// async function processCsv() {

  // const brandedFoodStream = fs.createReadStream(brandedFoodPath);
  // brandedFoodStream
  //   .pipe(csv.parse({ columns: true }))
  //   .pipe(new Writable({
  //     // highWaterMark: 4096, // default: 16
  //     highWaterMark: 512, // default: 16
  //     objectMode: true,
  //     construct(callback) {
  //       console.log('start');
  //       callback();
  //     },
  //     write(chunk, _, callback) {
  //       processBrandedFoodCsvRow([chunk], categoryToId)
  //         .then(() => callback())
  //         .catch((err) => callback(err));
  //     },
  //     writev(chunks, callback) {
  //       processBrandedFoodCsvRow(chunks.map(({ chunk }) => chunk), categoryToId)
  //         .then(() => callback())
  //         .catch((err) => callback(err));
  //     },
  //   }))
  //   .on('finish', () => {
  //     console.log('finished');
  //   })
  //   .on('error', (error) => {
  //     console.log(error.message);
  //     process.exit(1);
  //   });
// }

// function toUUID(val: string) {
//   const hash = crypto.createHash('md5').update(val).digest('hex');
//   const uuid = `${hash.slice(0,8)}-${hash.slice(8,12)}-${hash.slice(12,16)}-${hash.slice(16,20)}-${hash.slice(20)}`;
//   return uuid;
// }

// async function processBrandedFoodCsvRow(fdcFoods: CsvBrandedFood[]): Promise<void> {
//
//   const foodRows = fdcFoods.map(fdcFood => {
//     const newFoodId = toUUID(fdcFood.fdc_id);
//     const foodCategory = normalizeFoodCategory(fdcFood.branded_food_category);
//     const foodCategoryId = toUUID(foodCategory);
//
//     const foodUnits = [
//       {
//         name: fdcFood.household_serving_fulltext ? `serving (${fdcFood.household_serving_fulltext})` : 'serving',
//         abbreviation: 'serv',
//         halves: false,
//         thirds: false,
//         fourths: false,
//         sixths: false,
//         eighths: false,
//         sixteenths: false,
//         foodUnitAmount: Number(fdcFood.serving_size),
//         baseUnitAmountRatio: Number(fdcFood.serving_size) / baseUnitAmount,
//         servingSizeAmount: 1,
//         foodId: newFoodId,
//       },
//     ];
//     if (fdcFood.serving_size_unit === 'g') {
//       foodUnits.push(...weightFoodUnitInputs.map(unit => {
//         return {
//           ...unit,
//           foodId: newFoodId,
//         };
//       }));
//     } else if (fdcFood.serving_size_unit === 'ml') {
//       foodUnits.push(...volumeFoodUnitInputs.map(unit => {
//         return {
//           ...unit,
//           foodId: newFoodId,
//         };
//       }));
//     }
//
//     foodUnitsToInsert.push(...foodUnits);
//
//     const row = [
//       newFoodId,
//       '',
//       baseUnitAmount,
//       fdcFood.serving_size_unit,
//       'usda',
//       'branded_food',
//       Number(fdcFood.fdc_id),
//       foodCategoryId,
//     ];
//     return Prisma.sql`(${Prisma.join(row)})`;
//   });
//
//   console.log(foodRows)
//
//   await prismaClient.$executeRaw`
//     INSERT INTO "Food" (
//       "id",
//       "name",
//       "baseUnitAmount",
//       "baseUnit",
//       "source",
//       "usdaDataType",
//       "fdcId",
//       "foodCategoryId"
//     )
//     VALUES ${Prisma.join(foodRows)}
//     ON CONFLICT DO NOTHING;
//   `;
//
//   const foodUnitRows = foodUnitsToInsert.map(foodUnit => {
//     const newFoodUnitId = crypto.randomUUID();
//     const row = [
//       newFoodUnitId,
//       foodUnit.name,
//       foodUnit.abbreviation,
//       foodUnit.servingSizeAmount,
//       foodUnit.halves,
//       foodUnit.thirds,
//       foodUnit.fourths,
//       foodUnit.sixths,
//       foodUnit.eighths,
//       foodUnit.sixteenths,
//       foodUnit.baseUnitAmountRatio,
//       foodUnit.foodUnitAmount,
//       foodUnit.foodId,
//     ];
//     return Prisma.sql`(${Prisma.join(row)})`;
//   });
//
//   try {
//     await prismaClient.$executeRaw`
//       INSERT INTO "FoodUnit" (
//         "id",
//         "name",
//         "abbreviation",
//         "servingSizeAmount",
//         "halves",
//         "thirds",
//         "fourths",
//         "sixths",
//         "eighths",
//         "sixteenths",
//         "baseUnitAmountRatio",
//         "foodUnitAmount",
//         "foodId"
//       )
//       VALUES ${Prisma.join(foodUnitRows)}
//       ON CONFLICT DO NOTHING;
//     `;
//   } catch (error) {
//     console.log(foodUnitRows);
//     console.error(error);
//     process.exit();
//   }
// }
