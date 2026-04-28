import type { NodeRenderer } from '../renderer.js';

export const gridEmitter: NodeRenderer<'grid', string> = {
  kind: 'grid',
  async emit(node, ctx) {
    let out = '';
    const p = node.source.props;
    const border = p.border ?? 0;
    if (border > 0) {
      out += `^FO${Math.round(node.box.left)},${Math.round(node.box.top)}^GB${Math.round(
        node.box.width,
      )},${Math.round(node.box.height)},${border},,0^FS\n`;
    }
    for (const child of node.children) out += await ctx.emit(child);
    return out;
  },
};
