export const SizeType = {
  Absolute: 0,
  Fraction: 1,
  Relative: 2,
  Auto: 3,
} as const;

export type SizeTypeValue = (typeof SizeType)[keyof typeof SizeType];
