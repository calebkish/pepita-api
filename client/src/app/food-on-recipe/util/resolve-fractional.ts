import { FractionalValue } from "src/app/dynamic-form/components/fractional-input.component";

export function resolveFractional(value: FractionalValue): number {
  return value.shouldUseScaleDecimal
    ? value.scaleDecimal
    : value.scaleBase + (value.scaleNumerator / value.scaleDenominator);
}

