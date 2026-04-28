import type { NodeRenderer } from '../renderer.js';
import type { BarcodeProps, Code128Subset } from '../../ir/barcode.js';

const subsetPrefix = (s: Code128Subset | undefined): string => {
  switch (s) {
    case 'A':
      return '>9';
    case 'B':
      return '>:';
    case 'C':
      return '>;';
    default:
      return '';
  }
};

const command = (p: BarcodeProps, height: number, iLine: 'Y' | 'N'): { cmd: string; prepend: string } => {
  switch (p.type) {
    case 'Code11':
      return { cmd: `^B1N,N,${height},${iLine},N`, prepend: '' };
    case 'Interleaved25':
      return { cmd: `^B2N,${height},${iLine},N,N`, prepend: '' };
    case 'Code39':
      return { cmd: `^B3N,N,${height},${iLine},N`, prepend: '' };
    case 'PlanetCode':
      return { cmd: `^B5N,${height},${iLine},N`, prepend: '' };
    case 'PDF417': {
      const rowHeight = 10;
      const rows = Math.max(1, Math.ceil(height / rowHeight));
      const maxLen = p.maxLength ?? 32;
      const columns = Math.max(1, Math.ceil(maxLen / rows));
      return { cmd: `^B7N,${rowHeight},0,${columns},${rows},N`, prepend: '' };
    }
    case 'EAN8':
      return { cmd: `^B8N,${height},${iLine},N`, prepend: '' };
    case 'UPCE':
      return { cmd: `^B9N,${height},${iLine},N,Y`, prepend: '' };
    case 'Code93':
      return { cmd: `^BAN,${height},${iLine},N,N`, prepend: '' };
    case 'Code128':
      return { cmd: `^BCN,${height},${iLine},N,N,N`, prepend: subsetPrefix(p.subset) };
    case 'EAN13':
      return { cmd: `^BEN,${height},${iLine},N`, prepend: '' };
    case 'Industrial25':
      return { cmd: `^BIN,${height},${iLine},N`, prepend: '' };
    case 'Standard25':
      return { cmd: `^BJN,${height},${iLine},N`, prepend: '' };
    case 'ANSICodabar':
      return { cmd: `^BKN,N,${height},${iLine},N,A,A`, prepend: '' };
    case 'Logmars':
      return { cmd: `^BLN,${height},N`, prepend: '' };
    case 'MSI':
      return { cmd: `^BMN,B,${height},${iLine},N,N`, prepend: '' };
    case 'Plessey':
      return { cmd: `^BPN,N,${height},${iLine},N`, prepend: '' };
    case 'QRCode': {
      const magnification = Math.max(1, Math.min(10, Math.floor(height / 25)));
      return { cmd: `^BQ,2,${magnification},Q,7`, prepend: 'QA,' };
    }
    case 'DataMatrix': {
      const moduleHeight = Math.max(1, Math.min(200, height || 10));
      return { cmd: `^BXN,${moduleHeight},200,,,~,1`, prepend: '' };
    }
    case 'PostNet':
      return { cmd: `^BZN,${height},${iLine},N`, prepend: '' };
  }
};

export const barcodeEmitter: NodeRenderer<'barcode', string> = {
  kind: 'barcode',
  emit(node) {
    const p = node.source.props;
    const iLine: 'Y' | 'N' = p.interpretationLine === false ? 'N' : 'Y';
    const { cmd, prepend } = command(p, Math.round(node.box.height), iLine);

    let out = `^FO${Math.round(node.box.left)},${Math.round(node.box.top)}`;
    if (p.invert) out += '^FR';
    out += cmd;
    out += `^FD${prepend}${p.data}^FS\n`;
    return out;
  },
};
