export const Rotation = {
  Normal: 'N',
  Right: 'R',
  Bottom: 'I',
  Left: 'B',
} as const;

export type RotationValue = (typeof Rotation)[keyof typeof Rotation];
