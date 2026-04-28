import { BaseGraphicComponent } from './base-graphic-component.js';

export class Box extends BaseGraphicComponent {
  override typeName = 'Box';

  cornerRadius = 0;

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    let zpl = '^FO' + Math.round(position.left) + ',' + Math.round(position.top);

    if (this.invert) zpl += '^FR';

    let thickness = this.border;
    if (this.fill) thickness = Math.min(position.width, position.height);

    const shorterSide = Math.min(position.width, position.height);
    const roundingIndex = Math.round((this.cornerRadius * 16) / shorterSide);

    if (thickness !== undefined && thickness > 0) {
      zpl +=
        '^GB' + position.width + ',' + position.height + ',' + (thickness || '') + ',,' + roundingIndex + '^FS' + '\n';
    } else {
      zpl += '\n';
    }

    zpl += await super.generateZPL(position.left, position.top, position.width, position.height);

    return zpl;
  }
}
