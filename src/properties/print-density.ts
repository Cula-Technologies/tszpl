import type { PrintDensityValue } from '../enums/print-density-name.js';

export class PrintDensity {
  readonly typeName = 'PrintDensity';

  value: PrintDensityValue;

  constructor(value: PrintDensityValue) {
    this.value = value;
  }

  toString(): string {
    return `${this.value} dpmm`;
  }
}
