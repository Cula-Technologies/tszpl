import type { NodeRenderer } from '../renderer.js';

export const lineEmitter: NodeRenderer<'line', string> = {
  kind: 'line',
  emit(node) {
    const p = node.source.props;
    if (p.thickness <= 0) return '';
    const dx = p.x2 - p.x1;
    const dy = p.y2 - p.y1;
    const w = Math.abs(dx);
    const h = Math.abs(dy);
    const x = node.box.left + Math.min(p.x1, p.x2);
    const y = node.box.top + Math.min(p.y1, p.y2);
    let out = `^FO${Math.round(x)},${Math.round(y)}`;
    if (p.invert) out += '^FR';
    if (dx === 0 || dy === 0) {
      const boxW = Math.max(w, p.thickness);
      const boxH = Math.max(h, p.thickness);
      out += `^GB${boxW},${boxH},${p.thickness},,0^FS\n`;
    } else {
      const orientation = Math.sign(dx) === Math.sign(dy) ? 'R' : 'L';
      out += `^GD${w},${h},${p.thickness},B,${orientation}^FS\n`;
    }
    return out;
  },
};
