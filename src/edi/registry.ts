// Maps an 837 variant to its spec.
import { spec837i } from "./spec837i";
import { spec837p } from "./spec837p";
import { spec837d } from "./spec837d";
import type { VariantSpec } from "./x12";

const SPECS: Record<string, VariantSpec> = {
  "837I": spec837i,
  "837P": spec837p,
  "837D": spec837d
};

export function getSpec(variant: string): VariantSpec | undefined {
  return SPECS[variant];
}

export function availableVariants(): string[] {
  return Object.keys(SPECS);
}
