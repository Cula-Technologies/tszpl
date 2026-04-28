import type { NodeRenderer } from '../renderer.js';

export const circleEmitter: NodeRenderer<'circle', string> = {
  kind: 'circle',
  async emit(node, ctx) {
    const p = node.source.props;
    const fill = p.fill === true;
    const border = p.border ?? 0;
    const w = Math.round(node.box.width);
    const h = Math.round(node.box.height);
    const thickness = fill ? Math.min(w, h) : border;

    let out = '';
    if (thickness > 0) {
      out += `^FO${Math.round(node.box.left)},${Math.round(node.box.top)}`;
      if (p.invert) out += '^FR';
      if (w === h) {
        out += `^GC${w},${thickness},B^FS\n`;
      } else {
        out += `^GE${w},${h},${thickness},B^FS\n`;
      }
    }
    for (const child of node.children) out += await ctx.emit(child);
    return out;
  },
};
