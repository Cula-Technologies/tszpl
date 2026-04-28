export const AlignmentValue = {
  Start: 'Start',
  Center: 'Center',
  End: 'End',
} as const;

export type AlignmentValueType = (typeof AlignmentValue)[keyof typeof AlignmentValue];
