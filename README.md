# Development
* `npx prisma migrate dev --name add_job_title`
* `npx prisma studio`

# Production
* `npx prisma migrate deploy`
    * Should be part of CI/CD pipeline
    * `https://www.prisma.io/docs/guides/deployment/deploy-database-changes-with-prisma-migrate`


# TODO

* Why would a user create a custom Food?
    * It doesn't exist from USDA entries, but there's some other source where it
      can be grabbed from e.g. online or from a food label.

## Settings
* Nutrition Targets (calories, protein, carbs, fat)
* Default meals when a day is created
* Default divisions on `Unit`s


## Publishing
* Foods
* Recipes
* Plans


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

















# Data

## Branded Food

- Download branded food zip file:
    - Webpage: `https://fdc.nal.usda.gov/download-datasets.html`
    - CSV download: `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2022-10-28.zip`
- Unzip the file.

Create a sqlite database file.
```
sqlite3 food-data.db

.mode csv
.headers on

.import branded_food.csv branded_food
.import food.csv food
.import food_nutrient.csv food_nutrient

CREATE TABLE "joined_branded_food_data" AS
SELECT *
FROM branded_food AS bf
JOIN food AS f ON f.fdc_id = bf.fdc_id;

CREATE TABLE "latest_branded_food" AS
SELECT
    j1.gtin_upc,
    j1.branded_food_category,
    j1.brand_owner,
    j1.description,
    j1.fdc_id,
    j1.serving_size,
    j1.serving_size_unit,
    j1.household_serving_fulltext
FROM joined_branded_food_data as j1
JOIN
(
    SELECT gtin_upc, max(publication_date) as publication_date
    FROM joined_branded_food_data
    GROUP BY gtin_upc
) as j2
WHERE  j1.gtin_upc = j2.gtin_upc AND j1.publication_date = j2.publication_date



.mode csv
.headers on

.once exports/latest_branded_food.csv
SELECT * FROM latest_branded_food;

.once exports/food_nutrient.csv
SELECT fn.fdc_id, fn.nutrient_id, fn.amount
FROM food_nutrient as fn
WHERE fn.nutrient_id IN ('1003', '1005', '1008', '1004') AND
    fn.fdc_id IN (SELECT fdc_id FROM latest_branded_food);

.once exports/branded_food_category.csv
SELECT DISTINCT branded_food_category
FROM latest_branded_food;

.once exports/branded_food_brand_owner.csv
SELECT DISTINCT brand_owner
FROM latest_branded_food;

.q
```


Now w/ Typescript script, we need to:
    transform `branded_food_category.csv` to `food-category.csv`
    transform `branded_food_brand_owner.csv` to `food-brand.csv`
    transform `latest_branded_food.csv` to `food.csv`
    transform `latest_branded_food.csv` to `food-unit.csv`
    transform `food_nutrient.csv` to `food-nutrient.csv`


Then with postgres:
```
psql -h localhost -p 5433 -U postgres cooldb <<EOSQL
TRUNCATE TABLE "FoodCategory" CASCADE;
TRUNCATE TABLE "FoodBrand" CASCADE;
TRUNCATE TABLE "Food" CASCADE;
TRUNCATE TABLE "NutrientsOnFoods" CASCADE;
TRUNCATE TABLE "FoodUnit" CASCADE;
\copy "FoodCategory" from 'food-category.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "FoodBrand" from 'food-brand.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "Food" from 'food.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "NutrientsOnFoods" from 'food-nutrient.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "FoodUnit" from 'food-unit.csv' WITH (FORMAT CSV, HEADER MATCH)
EOSQL
```

## FNDDS

- Download branded food zip file:
    - Webpage: `https://fdc.nal.usda.gov/download-datasets.html`
    - CSV download: `https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_branded_food_csv_2022-10-28.zip`
- Unzip the file.

```
sqlite3 fndds.db

.mode csv
.headers on

.import food_portion.csv food_portion
.import food.csv food
.import food_nutrient.csv food_nutrient
.import nutrient.csv nutrient
.import survey_fndds_food.csv survey_fndds_food

CREATE TABLE "FoodExport" AS
SELECT f.fdc_id, f.description, s.food_code
FROM food as f
JOIN survey_fndds_food as s ON f.fdc_id = s.fdc_id;

CREATE TABLE "NutrientsOnFoodsExport" AS
SELECT fn.nutrient_id, n.name, n.unit_name, fn.amount, f.food_code, f.fdc_id, n.id
FROM food_nutrient as fn
JOIN nutrient as n ON fn.nutrient_id = n.nutrient_nbr
JOIN survey_fndds_food as f ON fn.fdc_id = f.fdc_id
WHERE fn.nutrient_id IN (203, 204, 205, 208);

CREATE TABLE "FoodUnitExport" AS
SELECT fp.fdc_id, s.food_code, fp.portion_description, fp.gram_weight
FROM food_portion as fp
JOIN survey_fndds_food as s ON fp.fdc_id = s.fdc_id;

.mode csv
.headers on

.once exports/FoodExport.csv
SELECT * FROM "FoodExport";

.once exports/NutrientsOnFoodsExport.csv
SELECT * FROM "NutrientsOnFoodsExport";

.once exports/FoodUnitExport.csv
SELECT * FROM "FoodUnitExport";

.q
```


As an alternative, copy from STDIN:
`psql -d '' -c 'COPY "Food" FROM STDIN WITH (FORMAT CSV, HEADER MATCH)' < food.csv`


# Fly.io

```bash
fly launch
# Chicago
# Choose to create postgres database:
    # Cluster size: 1
    # VM size: shared-cpu-1x - 256
    # Volume size: 3

# Reseting
fly secrets unset DATABASE_URL

fly pg create --volume-size 3 --region ord --initial-cluster-size 1
# fly vol extend <id> -s <number_of_gb>
fly pg attach --app pepita pepita-db
fly proxy 5432 -a pepita-db
npx prisma db push
npm run import-branded
cd import/data/branded/postgres-copy
psql -d "postgres://pepita:PASSWORD@localhost:5432/pepita"
```

```
psql -d "postgres://pepita:PASSWORD@localhost:5432/pepita" << EOSQL
TRUNCATE TABLE "FoodCategory" CASCADE;
TRUNCATE TABLE "FoodBrand" CASCADE;
TRUNCATE TABLE "Food" CASCADE;
TRUNCATE TABLE "NutrientsOnFoods" CASCADE;
TRUNCATE TABLE "FoodUnit" CASCADE;
\copy "FoodCategory" from 'food-category.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "FoodBrand" from 'food-brand.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "Food" from 'food.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "NutrientsOnFoods" from 'food-nutrient.csv' WITH (FORMAT CSV, HEADER MATCH)
\copy "FoodUnit" from 'food-unit.csv' WITH (FORMAT CSV, HEADER MATCH)
EOSQL
```























const currentWeight: number = INPUT();

const weightUnitPreference: 'pounds' | 'kilograms' = INPUT();

const gender: 'male' | 'female' = INPUT();

const measurementUnitPreference: 'inch' | 'centimeter' = INPUT();

const waistMeasurement = INPUT();
const heightMeasurement = INPUT();
const neckMeasurement = INPUT();
const hipMeasurement = INPUT();

const bodyFat = (() => {
    if (gender === 'male') {
        if (measurementUnitPreference === 'centimeter') {
            return 86.01 * log(waistMeasurement - neckMeasurement) - 70.041 * log(heightMeasurement) + 30.3;
        } else if (measurementUnitPreference === 'inch') {
            return 86.01 * log((waistMeasurement - neckMeasurement) * 2.54) - 70.041 * log(heightMeasurement * 2.54) + 30.3;
        }
    } else if (gender === 'female') {
        if (measurementUnitPreference === 'centimeter') {
            return 495 / (1.29579 - 0.35004 * log10(waistMeasurement + hipMeasurement - neckMeasurement) + 0.221 * log10(heightMeasurement)) - 450;
        } else if (measurementUnitPreference === 'inch') {
            return 495 / (1.29579 - 0.35004 * log10((waistMeasurement + hipMeasurement - neckMeasurement) * 2.54) + 0.221 * log10(heightMeasurement * 2.54)) - 450;
        }
    }
})();


const protein = currentWeight;
const proteinLowerBound = currentWeight * 0.8;
const proteinUpperBound = currentWeight * 1.2;

const recommendedFatMultiplier = (() => {
    if (gender === 'male') {
        if (bodyFat < 25) {
             return 0.22;
        } else {
            return 0.25;
        }
    }
    if (gender === 'female') {
        return 0.3;
    }
})();

const lowerFatMultiplier = (() => {
    if (gender === 'male') {
        return 0.15;
    } else {
        return 0.2;
    }
})();

const upperFatMultiplier = (() => {
    if (gender === 'male') {
        return 0.3;
    } else {
        return 0.4;
    }
})();

const fat = (recommendedFatMultiplier * neededCaloriesToEat)/9;
const fatLowerBound = (lowerFatMultiplier * neededCaloriesToEat)/9;
const fatUpperBound = (upperFatMultiplier * neededCaloriesToEat)/9;

const carbs = (neededCaloriesToEat - (protein * 4) - (fat * 9)) / 4;
const carbsLowerBound = carbs * 0.8;
const carbsUpperBound = carbs * 1.2;




























