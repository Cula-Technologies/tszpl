import type { NodeRenderer } from '../renderer.js';

export const rawEmitter: NodeRenderer<'raw', string> = {
  kind: 'raw',
  emit(node) {
    const data = node.source.props.data;
    if (!data) return '';
    return data.endsWith('\n') ? data : data + '\n';
  },
};
