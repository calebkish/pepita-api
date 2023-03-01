import { FractionalValue, getFractionSteps } from "src/app/dynamic-form/components/fractional-input.component";
import { resolveFractional } from "src/app/food-on-recipe/util/resolve-fractional";

export function scaleFractional(fraction: FractionalValue, scale: number): FractionalValue {
  const scaledToRecipeDecimal = resolveFractional(fraction) * scale;

  const steps = getFractionSteps(fraction);

  const scaledToRecipeBase = Math.floor(scaledToRecipeDecimal);
  const scaledToRecipeLeftOver = scaledToRecipeDecimal - scaledToRecipeBase;

  const { step: scaledToRecipeFraction } = steps
    .reduce((closest, step) => {
      const diff = Math.abs(scaledToRecipeLeftOver - (step.scaleNumerator / step.scaleDenominator));
      return diff < closest.diff ? { step, diff } : closest;
    }, { step: { scaleNumerator: 0, scaleDenominator: 0 }, diff: Infinity })

  return {
    scaleNumerator: scaledToRecipeFraction.scaleNumerator,
    scaleDenominator: scaledToRecipeFraction.scaleDenominator,
    scaleBase: scaledToRecipeBase,
    scaleDecimal: scaledToRecipeDecimal,
    shouldUseScaleDecimal: fraction.shouldUseScaleDecimal,
    halves: fraction.halves,
    thirds: fraction.thirds,
    fourths: fraction.fourths,
    sixths: fraction.sixths,
    eighths: fraction.eighths,
    sixteenths: fraction.sixteenths,
  };
}
