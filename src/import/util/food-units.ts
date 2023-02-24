import { prismaClient } from "../../db.js";
import { createBaseUnits } from "./create-base-units.js";

interface UnitAssociation {
  abbreviation: string;
  factor: number;
}

const volumeUnitsAssociations: UnitAssociation[] = [
  {
    abbreviation: 'mL',
    factor: 1,
  },
  {
    abbreviation: 'L',
    factor: 1000,
  },
  {
    abbreviation: 'tsp',
    factor: 4.92892,
  },
  {
    abbreviation: 'tbsp',
    factor: 14.7868,
  },
  {
    abbreviation: 'fl oz',
    factor: 29.5735,
  },
  {
    abbreviation: 'cup',
    factor: 236.5882,
  },
  {
    abbreviation: 'qt',
    factor: 946.353,
  },
  {
    abbreviation: 'pt',
    factor: 473.1765,
  },
  {
    abbreviation: 'gal',
    factor: 3785.412,
  },
];

const weightUnitsAssociations: UnitAssociation[] = [
  {
    abbreviation: 'g',
    factor: 1,
  },
  {
    abbreviation: 'oz',
    factor: 28.3495, // relative to 1 gram
  },
  {
    abbreviation: 'lb',
    factor: 453.592, // relative to 1 gram
  },
];

export const baseUnitAmount = 100;

const volumeUnitsAbbreviations = volumeUnitsAssociations.map(unit => unit.abbreviation);
const weightUnitsAbbreviations = weightUnitsAssociations.map(unit => unit.abbreviation);

export async function createUnitsAndGetFoodUnitInputs() {
  const units = await createBaseUnits();

  const volumeUnits = units.filter(unit => volumeUnitsAbbreviations.includes(unit.abbreviation!));
  const weightUnits = units.filter(unit => weightUnitsAbbreviations.includes(unit.abbreviation!));


  const weightFoodUnitInputs = weightUnits.map(unit => {
    const association = weightUnitsAssociations
      .find(unitAssociation => unitAssociation.abbreviation === unit.abbreviation)!;

    return {
      name: unit.name,
      abbreviation: unit.abbreviation!,
      halves: unit.halves,
      thirds: unit.thirds,
      fourths: unit.fourths,
      sixths: unit.sixths,
      eighths: unit.eighths,
      sixteenths: unit.sixteenths,
      foodUnitAmount: association.factor,
      baseUnitAmountRatio: association.factor / baseUnitAmount,
      servingSizeAmount: 1,
    };
  });

  const volumeFoodUnitInputs = volumeUnits.map(unit => {
    const association = volumeUnitsAssociations
      .find(unitAssociation => unitAssociation.abbreviation === unit.abbreviation)!;

    return {
      name: unit.name,
      abbreviation: unit.abbreviation!,
      halves: unit.halves,
      thirds: unit.thirds,
      fourths: unit.fourths,
      sixths: unit.sixths,
      eighths: unit.eighths,
      sixteenths: unit.sixteenths,
      foodUnitAmount: association.factor,
      baseUnitAmountRatio: association.factor / baseUnitAmount,
      servingSizeAmount: 1,
    };
  });

  return {
    allUnitsOnDb: units,
    weightFoodUnitInputs,
    volumeFoodUnitInputs,
  };
}
