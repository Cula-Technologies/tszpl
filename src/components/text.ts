import { BaseVisualComponent } from './base-visual-component.js';
import { FontFamily } from '../properties/font-family.js';
import { Alignment } from '../properties/alignment.js';
import { FontFamilyName } from '../enums/font-family-name.js';
import { AlignmentValue } from '../enums/alignment-value.js';

export class Text extends BaseVisualComponent {
  override typeName = 'Text';

  text = '';
  fontFamily: FontFamily = new FontFamily(FontFamilyName.A);
  lineSpacing = 0;

  verticalAlignment: Alignment = new Alignment(AlignmentValue.Start);
  horizontalAlignment: Alignment = new Alignment(AlignmentValue.Start);

  characterWidth = 0;
  characterHeight = 0;

  getTextLines(): string[] {
    const expression = /\\r\\n|\\n/g;
    return this.text.replace(expression, '\n').split('\n');
  }

  characterMap(): number[][][][] {
    const lineCharacters: number[][][][] = [];
    const charset = this.fontFamily.definition.characters;

    const textLines = this.getTextLines();

    for (const textLine of textLines) {
      const currentLineCharacters: number[][][] = [];
      lineCharacters.push(currentLineCharacters);

      for (const rawCh of textLine) {
        const ch = charset[rawCh] === undefined ? ' ' : rawCh;
        const glyph = charset[ch];
        if (glyph !== undefined) currentLineCharacters.push(glyph);
      }
    }

    return lineCharacters;
  }

  calculateSize(): { width: number; height: number } {
    const characters = this.characterMap();
    const def = this.fontFamily.definition;
    const height = def.spacing.top + def.size.height + def.spacing.bottom;
    let width = 0;

    for (const line of characters) {
      let lineWidth = 0;
      for (const character of line) {
        const firstRow = character[0] ?? [];
        lineWidth += firstRow.length;
        lineWidth += def.spacing.left + def.spacing.right;
      }
      width = Math.max(lineWidth, width);
    }

    return { width, height };
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

    const size = this.calculateSize();

    if (this.verticalAlignment.value === AlignmentValue.End) {
      position.top = position.top + position.height - size.height;
    } else if (this.verticalAlignment.value === AlignmentValue.Center) {
      position.top = position.top + position.height / 2 - size.height / 2;
    }

    let zpl = '';
    if (this.invert) zpl += '^LRY\n';

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

    const lines = this.getTextLines();

    let textOffsetTop = 0;
    for (const line of lines) {
      zpl += '^FO' + Math.round(position.left) + ',' + Math.round(position.top + textOffsetTop);
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
      zpl += '^FD' + line + lineSeparator + '^FS\n';

      textOffsetTop += this.fontFamily.definition.size.height + this.lineSpacing;
    }

    if (this.invert) zpl += '^LRN\n';

    return zpl;
  }
}
