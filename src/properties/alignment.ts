import type { AlignmentValueType } from '../enums/alignment-value.js';

export class Alignment {
  readonly typeName = 'Alignment';

  value: AlignmentValueType;

  constructor(value: AlignmentValueType) {
    this.value = value;
  }

  toString(): string {
    return this.value;
  }
}
