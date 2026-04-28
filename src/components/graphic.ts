import { BaseVisualComponent } from './base-visual-component.js';
import { GraphicData } from '../properties/graphic-data.js';
import { Box } from './box.js';
import { LabelTools } from '../helpers/label-tools.js';
import { generateHexAscii, encodeHexAscii } from '../helpers/zpl-image-tools.js';

export class Graphic extends BaseVisualComponent {
  override typeName = 'Graphic';

  data: GraphicData = new GraphicData();
  override border = 0;

  generateContainer(): Box {
    const container = new Box();
    container.border = this.border;
    container.margin = this.margin;
    container.top = this.top;
    container.left = this.left;
    return container;
  }

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const container = this.generateContainer();
    let zpl = await container.generateZPL(
      offsetLeft,
      offsetTop,
      availableWidth,
      availableHeight,
      widthUnits,
      heightUnits,
    );

    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);
    const imageData = LabelTools.ImageResizer.resize(
      position.width,
      position.height,
      this.data.width,
      this.data.height,
      this.data.data,
    );

    zpl += '^FO' + Math.round(position.left) + ',' + Math.round(position.top);

    if (this.invert) zpl += '^FR';

    const widthBytes = Math.ceil(position.width / 8);
    const byteCount = widthBytes * position.height;
    let hexData = generateHexAscii(position.width, position.height, imageData);
    hexData = encodeHexAscii(hexData);

    zpl += '^GFA,' + byteCount + ',' + byteCount + ',' + widthBytes + ',' + hexData + '^FS\n';

    return zpl;
  }
}
