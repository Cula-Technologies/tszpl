import { BaseVisualComponent } from './base-visual-component.js';
import { BarcodeType } from '../properties/barcode-type.js';
import { BarcodeTypeName } from '../enums/barcode-type-name.js';

type BarcodeSubset = '' | 'A' | 'B' | 'C';

export class Barcode extends BaseVisualComponent {
  override typeName = 'Barcode';

  data = '';
  dataPrepend = '';
  maxLength = 32;
  type: BarcodeType = new BarcodeType(BarcodeTypeName.Code11);

  subset: BarcodeSubset = '';
  interpretationLine = true;

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    let zpl = '';

    zpl += '^FO' + Math.round(position.left) + ',' + Math.round(position.top);

    if (this.invert) zpl += '^FR';

    const iLine = this.interpretationLine ? 'Y' : 'N';

    switch (this.type.value) {
      case BarcodeTypeName.Code11:
        zpl += '^B1N,N,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.Interleaved25:
        zpl += '^B2N,' + position.height + ',' + iLine + ',N,N';
        break;
      case BarcodeTypeName.Code39:
        zpl += '^B3N,N,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.PlanetCode:
        zpl += '^B5N,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.PDF417: {
        const rowHeight = 10;
        const rows = Math.ceil(position.height / rowHeight);
        const bytes = this.maxLength * rows;
        const columns = Math.ceil(bytes / rows);
        zpl += '^B7N,' + rowHeight + ',0,' + columns + ',' + rows + ',N';
        break;
      }
      case BarcodeTypeName.EAN8:
        zpl += '^B8N,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.UPCE:
        zpl += '^B9N,' + position.height + ',' + iLine + ',N,Y';
        break;
      case BarcodeTypeName.Code93:
        zpl += '^BAN,' + position.height + ',' + iLine + ',N,N';
        break;
      case BarcodeTypeName.Code128:
        zpl += '^BCN,' + position.height + ',' + iLine + ',N,N,N';
        if (this.dataPrepend === '') {
          switch (this.subset) {
            case 'A':
              this.dataPrepend += '>9';
              break;
            case 'B':
              this.dataPrepend += '>:';
              break;
            case 'C':
              this.dataPrepend += '>;';
              break;
          }
        }
        break;
      case BarcodeTypeName.EAN13:
        zpl += '^BEN,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.Industrial25:
        zpl += '^BIN,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.Standard25:
        zpl += '^BJN,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.ANSICodabar:
        zpl += '^BKN,N,' + position.height + ',' + iLine + ',N,A,A';
        break;
      case BarcodeTypeName.Logmars:
        zpl += '^BLN,' + position.height + ',N';
        break;
      case BarcodeTypeName.MSI:
        zpl += '^BMN,B,' + position.height + ',' + iLine + ',N,N';
        break;
      case BarcodeTypeName.Plessey:
        zpl += '^BPN,N,' + position.height + ',' + iLine + ',N';
        break;
      case BarcodeTypeName.QRCode: {
        const magnification = Math.min(Math.floor(position.height / 25), 10);
        zpl += '^BQ,2,' + magnification + ',Q,7';
        if (this.dataPrepend === '') this.dataPrepend = 'QA,';
        break;
      }
      case BarcodeTypeName.DataMatrix:
        zpl += '^BXN,10,200,,,~,1';
        break;
      case BarcodeTypeName.PostNet:
        zpl += '^BZN,' + position.height + ',' + iLine + ',N';
        break;
    }

    zpl += '^FD' + this.dataPrepend + this.data;
    zpl += '^FS\n';

    return zpl;
  }
}
