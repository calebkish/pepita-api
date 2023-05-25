export type CoreNutrient = 'Protein' | 'Carbohydrate, by difference' | 'Total lipid (fat)' | 'Energy';

export const proteinName: CoreNutrient = 'Protein';
export const carbohydrateName: CoreNutrient = 'Carbohydrate, by difference';
export const fatName: CoreNutrient = 'Total lipid (fat)';
export const calorieName: CoreNutrient = 'Energy';

export const coreNutrients: CoreNutrient[] = [
  calorieName,
  proteinName,
  carbohydrateName,
  fatName,
];


