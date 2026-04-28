export const FontFamilyName = {
  A: 'A',
  B: 'B',
  D: 'D',
  E: 'E',
  F: 'F',
} as const;

export type FontFamilyValue = (typeof FontFamilyName)[keyof typeof FontFamilyName];
