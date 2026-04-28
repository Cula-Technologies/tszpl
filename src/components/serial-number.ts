import { Text } from './text.js';
import { AlignmentValue } from '../enums/alignment-value.js';

export class SerialNumber extends Text {
  override typeName = 'SerialNumber';

  format = '0001';
  increment = 1;
  printLeadingZeroes = true;

  override getTextLines(): string[] {
    const expression = /\\r\\n|\\n/g;
    return this.format.replace(expression, '\n').split('\n');
  }

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    let horizontalAlignment = 'L';
    let lineSeparator = '';
    switch (this.horizontalAlignment.value) {
      case AlignmentValue.Start:
        horizontalAlignment = 'L';
        break;
      case AlignmentValue.Center:
        horizontalAlignment = 'C';
        lineSeparator = '\\&';
        break;
      case AlignmentValue.End:
        horizontalAlignment = 'R';
        break;
    }

    let zpl = '';
    zpl += '^FO' + Math.round(position.left) + ',' + Math.round(position.top);
    zpl +=
      '^A' +
      this.fontFamily.value +
      ',' +
      (this.characterHeight || '') +
      ',' +
      (this.characterWidth || '') +
      ',' +
      '\n';
    zpl += '^FB' + Math.round(position.width) + ',1000,0,' + horizontalAlignment + ',0\n';
    zpl +=
      '^SN' +
      this.format +
      lineSeparator +
      ',' +
      this.increment +
      ',' +
      (this.printLeadingZeroes ? 'Y' : 'N') +
      '^FS\n';

    return zpl;
  }
}
