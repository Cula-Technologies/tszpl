import { BaseVisualComponent } from './base-visual-component.js';

export class Line extends BaseVisualComponent {
  override typeName = 'Line';

  x1 = 0;
  y1 = 0;
  x2 = 0;
  y2 = 0;

  thickness = 1;

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    if (this.thickness <= 0) return '';

    let zpl =
      '^FO' +
      Math.round(position.left + Math.min(this.x1, this.x2)) +
      ',' +
      Math.round(position.top + Math.min(this.y1, this.y2));

    if (this.invert) zpl += '^FR';

    const width = Math.abs(this.x1 - this.x2);
    const height = Math.abs(this.y1 - this.y2);

    let orientation = 'R';
    if ((this.x1 < this.x2 && this.y1 < this.y2) || (this.x2 < this.x1 && this.y1 < this.y2)) {
      orientation = 'L';
    }

    zpl += `^GD${width},${height},${this.thickness},B,${orientation}^FS\n`;

    return zpl;
  }
}
