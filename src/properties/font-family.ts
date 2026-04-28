import type { FontFamilyValue } from '../enums/font-family-name.js';
import { getFontDefinition, type FontDefinition } from '../fonts/b64-fonts.js';

export class FontFamily {
  readonly typeName = 'FontFamily';

  value: FontFamilyValue;

  constructor(value: FontFamilyValue) {
    this.value = value;
  }

  get definition(): FontDefinition {
    return getFontDefinition(this.value);
  }

  toString(): string {
    return this.value;
  }
}
