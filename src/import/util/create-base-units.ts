import { Unit } from "@prisma/client";
import { prismaClient } from "../../db.js";

export async function createBaseUnits(): Promise<Unit[]> {
  const unitsToWrite = [
    {
      abbreviation: 'IU',
      name: 'international unit',
    },
    {
      abbreviation: 'mg',
      name: 'milligram',
    },
    {
      abbreviation: 'μg',
      name: 'microgram',
    },
    {
      abbreviation: 'g',
      name: 'gram',
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
      abbreviation: 'mL',
      name: 'milliliter',
    },
    {
      abbreviation: 'L',
      name: 'liter',
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
    {
      abbreviation: 'kcal',
      name: 'calories',
    }
  ];

  const unitsToDbPromises = unitsToWrite.map(unit => {
    const { abbreviation, name, halves = false, fourths = false, thirds = false, eighths = false } = unit;
    const unitOnDb = prismaClient.unit.upsert({
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
    return unitOnDb;
  });

  const units = (await Promise.allSettled(unitsToDbPromises))
    .map(res => {
      if (res.status === 'fulfilled') {
        return res.value;
      } else {
        return null;
      }
    })
    .filter((v): v is Unit => v !== null);

  return units;
}

