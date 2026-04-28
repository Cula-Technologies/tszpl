import { BaseGraphicComponent } from './base-graphic-component.js';

export class Circle extends BaseGraphicComponent {
  override typeName = 'Circle';

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    let zpl = this.shapeZPL(position);

    zpl += await super.generateZPL(position.left, position.top, position.width, position.height);

    return zpl;
  }

  private shapeZPL(position: { left: number; top: number; width: number; height: number }): string {
    let zpl = '^FO' + Math.round(position.left) + ',' + Math.round(position.top);

    if (this.invert) zpl += '^FR';

    let thickness = this.border;
    if (this.fill) thickness = Math.min(position.width, position.height);

    if (thickness !== undefined && thickness > 0) {
      if (position.width !== position.height) {
        zpl += '^GE' + position.width + ',' + position.height + ',' + (thickness || '') + ',B' + '^FS' + '\n';
      } else {
        zpl += '^GC' + position.width + ',' + (thickness || '') + ',B' + '^FS' + '\n';
      }
    } else {
      zpl += '\n';
    }

    return zpl;
  }
}
