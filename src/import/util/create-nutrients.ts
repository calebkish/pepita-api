import { Nutrient } from "@prisma/client";
import { prismaClient } from "../../db.js";
import { toUUID } from "./to-uuid.js";

export async function createNutrients(): Promise<Nutrient[]> {
    const validNutrients = [
      { name: 'Protein', fdcNutrientId: 1003 },
      { name: 'Carbohydrate, by difference', fdcNutrientId: 1005 },
      { name: 'Energy', fdcNutrientId: 1008 },
      { name: 'Total lipid (fat)', fdcNutrientId: 1004 },
      // '1079', // fiber
      // '1051', // water
      // '1092', // potassium
      // '1089', // iron
      // '1087', // calcium
      // '1063', // sugars, total NLEA
      // '1093', // sodium
      // '1013', // lactose
      // '1012', // fructose
      // '1007', // ash
      // '1009', // starch
    ];


    for (const n of validNutrients) {
      await prismaClient.nutrient.upsert({
        where: {
          id: toUUID(n.fdcNutrientId.toString()),
          // name: n.name,
        },
        create: {
          id: toUUID(n.fdcNutrientId.toString()),
          name: n.name,
          fdcNutrientId: n.fdcNutrientId,
        },
        update: {},
      });
    }

    const nutrientsOnDb = await prismaClient.nutrient.findMany();

    return nutrientsOnDb;
}
