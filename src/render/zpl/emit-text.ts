import type { NodeRenderer } from '../renderer.js';
import { fontMetric } from '../../font-metrics.js';

const splitLines = (s: string): string[] => s.replace(/\r\n/g, '\n').split('\n');

const horizFlag = (h: 'start' | 'center' | 'end' | undefined): string =>
  h === 'center' ? 'C' : h === 'end' ? 'R' : 'L';

const lineSeparator = (h: 'start' | 'center' | 'end' | undefined): string => (h === 'center' ? '\\&' : '');

const fontSpec = (font: string, h?: number, w?: number): string => {
  if ((h === undefined || h === 0) && (w === undefined || w === 0)) return `^A${font}`;
  return `^A${font},${h ?? ''},${w ?? ''}`;
};

export const textEmitter: NodeRenderer<'text', string> = {
  kind: 'text',
  emit(node) {
    const p = node.source.props;
    const override: { height?: number; width?: number } = {};
    if (p.characterHeight !== undefined) override.height = p.characterHeight;
    if (p.characterWidth !== undefined) override.width = p.characterWidth;
    const metric = fontMetric(p.font, override);
    const lines = node.extras?.wrappedLines ?? splitLines(p.text);
    const lineSpacing = p.lineSpacing ?? 0;
    const lineStride = metric.height + lineSpacing;
    const totalH = lines.length === 0 ? 0 : lines.length * metric.height + (lines.length - 1) * lineSpacing;

    let topOffset = 0;
    if (p.align?.v === 'end') topOffset = node.box.height - totalH;
    else if (p.align?.v === 'center') topOffset = (node.box.height - totalH) / 2;

    const hFlag = horizFlag(p.align?.h);
    const sep = lineSeparator(p.align?.h);

    let out = '';
    if (p.invert) out += '^LRY\n';
    let dy = 0;
    for (const line of lines) {
      const x = Math.round(node.box.left);
      const y = Math.round(node.box.top + topOffset + dy);
      out += `^FO${x},${y}\n`;
      out += `${fontSpec(p.font, p.characterHeight, p.characterWidth)}\n`;
      out += `^FB${Math.round(node.box.width)},1000,0,${hFlag},0\n`;
      out += `^FD${line}${sep}^FS\n`;
      dy += lineStride;
    }
    if (p.invert) out += '^LRN\n';
    return out;
  },
};
