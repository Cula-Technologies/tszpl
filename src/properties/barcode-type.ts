import type { BarcodeTypeValue } from '../enums/barcode-type-name.js';

export class BarcodeType {
  readonly typeName = 'BarcodeType';

  value: BarcodeTypeValue;

  constructor(type: BarcodeTypeValue) {
    this.value = type;
  }

  toString(): string {
    return this.value;
  }
}
