import type { NodeRenderer } from '../renderer.js';

export const boxEmitter: NodeRenderer<'box', string> = {
  kind: 'box',
  async emit(node, ctx) {
    const p = node.source.props;
    const fill = p.fill === true;
    const border = p.border ?? 0;
    const cornerRadius = p.cornerRadius ?? 0;

    const w = Math.round(node.box.width);
    const h = Math.round(node.box.height);
    const thickness = fill ? Math.min(w, h) : border;
    const shorter = Math.max(Math.min(w, h), 1);
    const round = Math.min(8, Math.max(0, Math.round((cornerRadius * 8) / shorter)));

    let out = '';
    if (thickness > 0) {
      out += `^FO${Math.round(node.box.left)},${Math.round(node.box.top)}`;
      if (p.invert) out += '^FR';
      out += `^GB${w},${h},${thickness},,${round}^FS\n`;
    }
    for (const child of node.children) out += await ctx.emit(child);
    return out;
  },
};
