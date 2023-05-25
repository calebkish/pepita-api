import { intakeData } from './intake-data.js';

type WeightUnitPreference = 'pounds' | 'kilograms';
type Sex = 'male' | 'female';
type MeasurementUnitPreference = 'inch' | 'centimeter';

const currentWeight: number = 163; // INPUT
const weightUnitPreference: WeightUnitPreference = 'pounds' // INPUT
const sex: Sex = 'male' // INPUT
const measurementUnitPreference: MeasurementUnitPreference = 'inch'; // INPUT

const waistMeasurement: number = 34; // INPUT
const heightMeasurement: number = 71; // INPUT
const neckMeasurement: number = 15; // INPUT
const hipMeasurement: number | undefined = undefined; // INPUT (if sex === 'female')

const initialBodyFat = getInitialBodyFat({
  sex, measurementUnitPreference, waistMeasurement, heightMeasurement, neckMeasurement, hipMeasurement
});

const shouldCalculateGoalWeightChange: boolean = false; // INPUT

const calculatedGoalWeightChange = (() => {
  if (!shouldCalculateGoalWeightChange) return null;

  // @TODO actually calculate it
  return 0;
})();

const genderTdeeMultiplier = sex === 'male' ? 1.5 : 1.55;

// This is used if you don't want use calculated goal weight change
const goalWeightChangePerWeek = 1;

const calculatedTdeesPerWeek = intakeData.map((days, i) => {
  if (days.length === 0) {
    if (i === 0) {
      // AN22
      if (weightUnitPreference === 'pounds') {
        return (370 + (9.8 * (currentWeight * ((100 - initialBodyFat) / 100)))) * genderTdeeMultiplier;
      } else {
        return (370 + (21.6 * (currentWeight * ((100 - initialBodyFat) / 100)))) * genderTdeeMultiplier;
      }
    } else {
      const previousTdee = intakeData[i - 1]
    }
  }

  // AW37
  const averageWeight = avg(days.map(({ weight }) => weight));

  const weightChangeFromPrevious = (() => {
    if (i === 0) {
      return averageWeight - currentWeight;
    } else {
      const previousAverageWeight = avg(intakeData[i - 1].map(({ weight }) => weight));
      return averageWeight - previousAverageWeight;
    }
  })();

  // BD7
  const conversionThing = weightUnitPreference === 'pounds' ? 3500 : 7716;

  const tdee = averageWeight + (((-weightChangeFromPrevious) * conversionThing) / days.length)
});

function calculateTdeeFromWeek() {

}

const estimatedCurrentTdee = (() => {
// if there amount of calculated TDEEs is greater than 3...
  // then use the latest calculated TDEE
  // else...
  if (weightUnitPreference === 'pounds') {
    return (370 + (9.8 * (currentWeight * ((100 - genderTdeeMultiplier) / 100)) )) * genderTdeeMultiplier;
  } else { // kg
    return (370 + (21.6 * (currentWeight * ((100 - genderTdeeMultiplier) / 100)) )) * genderTdeeMultiplier;
  }
})();




doStuff({
  currentWeight, sex, neededCaloriesToEat: 3000
});


function doStuff({
  currentWeight,
  sex,
  neededCaloriesToEat,
}: {
  currentWeight: number,
  sex: Sex,
  neededCaloriesToEat: number,
}) {
  const protein = currentWeight;
  const proteinLowerBound = currentWeight * 0.8;
  const proteinUpperBound = currentWeight * 1.2;

  const recommendedFatMultiplier = (() => {
    if (sex === 'male') {
      return initialBodyFat < 25 ? 0.22 : 0.25;
    } else {
      return 0.3;
    }
  })();

  const lowerFatMultiplier = (() => {
    return sex === 'male' ? 0.15 : 0.2;
  })();

  const upperFatMultiplier = (() => {
    return sex === 'male' ? 0.3 : 0.4;
  })();

  const fat = (recommendedFatMultiplier * neededCaloriesToEat) / 9;
  const fatLowerBound = (lowerFatMultiplier * neededCaloriesToEat) / 9;
  const fatUpperBound = (upperFatMultiplier * neededCaloriesToEat) / 9;

  const carbs = (neededCaloriesToEat - (protein * 4) - (fat * 9)) / 4;
  const carbsLowerBound = carbs * 0.8;
  const carbsUpperBound = carbs * 1.2;
}


function getInitialBodyFat({
  sex,
  measurementUnitPreference,
  waistMeasurement,
  heightMeasurement,
  neckMeasurement,
  hipMeasurement,
}: {
  sex: Sex,
  measurementUnitPreference: MeasurementUnitPreference,
  waistMeasurement: number,
  heightMeasurement: number,
  neckMeasurement: number,
  hipMeasurement?: number,
}): number {
  // AL6
  if (sex === 'male') {
    switch (measurementUnitPreference) {
      case 'centimeter': return 86.01 * Math.log10(waistMeasurement - neckMeasurement) - 70.041 * Math.log10(heightMeasurement) + 30.3;
      case 'inch': return 86.01 * Math.log10((waistMeasurement - neckMeasurement) * 2.54) - 70.041 * Math.log10(heightMeasurement * 2.54) + 30.3;
    }
  } else {
    switch (measurementUnitPreference) {
      case 'centimeter': return 495 / (1.29579 - 0.35004 * Math.log10(waistMeasurement + hipMeasurement! - neckMeasurement) + 0.221 * Math.log10(heightMeasurement)) - 450;
      case 'inch': return 495 / (1.29579 - 0.35004 * Math.log10((waistMeasurement + hipMeasurement! - neckMeasurement) * 2.54) + 0.221 * Math.log10(heightMeasurement * 2.54)) - 450;
    }
  }
}

function avg(vals: number[]): number {
  return vals.reduce((prev, curr) => prev + curr, 0) / vals.length;
}
