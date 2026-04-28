import type { ResolvedNode } from '../../layout/resolved.js';
import type { NodeRenderer } from '../renderer.js';

const containsUnicode = (node: ResolvedNode): boolean => {
  if (node.kind === 'unicodeText') return true;
  return node.children.some(containsUnicode);
};

export const labelEmitter: NodeRenderer<'label', string> = {
  kind: 'label',
  async emit(node, ctx) {
    let zpl = '^XA\n';
    if (node.source.props.useUnicode || containsUnicode(node)) zpl += '^CI28\n';
    for (const child of node.children) zpl += await ctx.emit(child);
    zpl += '^XZ';
    return zpl;
  },
};
