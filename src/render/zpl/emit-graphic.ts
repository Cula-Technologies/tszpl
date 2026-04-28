import type { NodeRenderer } from '../renderer.js';
import type { GraphicData } from '../../ir/graphic.js';

const encodeGFA = (data: GraphicData): { hex: string; bytesPerRow: number; totalBytes: number } => {
  const bytesPerRow = Math.ceil(data.width / 8);
  const totalBytes = bytesPerRow * data.height;
  const bytes = new Array<number>(totalBytes).fill(0);
  for (let y = 0; y < data.height; y++) {
    for (let x = 0; x < data.width; x++) {
      const bit = data.bits[y * data.width + x] ?? 0;
      if (!bit) continue;
      const byteIdx = y * bytesPerRow + (x >> 3);
      const bitInByte = 7 - (x & 7);
      bytes[byteIdx] = (bytes[byteIdx] ?? 0) | (1 << bitInByte);
    }
  }
  const hex = bytes.map((b) => b.toString(16).toUpperCase().padStart(2, '0')).join('');
  return { hex, bytesPerRow, totalBytes };
};

export const graphicEmitter: NodeRenderer<'graphic', string> = {
  kind: 'graphic',
  emit(node) {
    const p = node.source.props;
    const { hex, bytesPerRow, totalBytes } = encodeGFA(p.data);

    let out = `^FO${Math.round(node.box.left)},${Math.round(node.box.top)}`;
    if (p.invert) out += '^FR';
    out += `^GFA,${totalBytes},${totalBytes},${bytesPerRow},${hex}^FS\n`;
    return out;
  },
};
