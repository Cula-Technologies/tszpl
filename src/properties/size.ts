import { SizeType, type SizeTypeValue } from '../enums/size-type.js';

export class Size {
  readonly typeName = 'Size';

  value: number;
  sizeType: SizeTypeValue;

  constructor(value?: number, sizeType?: SizeTypeValue) {
    this.value = value ?? 0;
    this.sizeType = sizeType ?? SizeType.Absolute;
  }

  getValue(unitSize?: number): number {
    if (typeof unitSize === 'number' && this.sizeType === SizeType.Relative) {
      return this.value * unitSize;
    }
    return this.value;
  }

  toString(): string {
    return this.value + (this.sizeType === SizeType.Relative ? '*' : '');
  }
}
