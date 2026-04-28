import type { NodeRenderer } from '../renderer.js';
import { fontMetric } from '../../font-metrics.js';

const horizFlag = (h: 'start' | 'center' | 'end' | undefined): string =>
  h === 'center' ? 'C' : h === 'end' ? 'R' : 'L';

const fontSpec = (font: string, h?: number, w?: number): string => {
  if ((h === undefined || h === 0) && (w === undefined || w === 0)) return `^A${font}`;
  return `^A${font},${h ?? ''},${w ?? ''}`;
};

export const serialEmitter: NodeRenderer<'serial', string> = {
  kind: 'serial',
  emit(node) {
    const p = node.source.props;
    const override: { height?: number; width?: number } = {};
    if (p.characterHeight !== undefined) override.height = p.characterHeight;
    if (p.characterWidth !== undefined) override.width = p.characterWidth;
    const metric = fontMetric(p.font, override);

    let topOffset = 0;
    if (p.align?.v === 'end') topOffset = node.box.height - metric.height;
    else if (p.align?.v === 'center') topOffset = (node.box.height - metric.height) / 2;

    const x = Math.round(node.box.left);
    const y = Math.round(node.box.top + topOffset);
    const inc = p.increment ?? 1;
    const lz = p.printLeadingZeroes === false ? 'N' : 'Y';

    let out = '';
    out += `^FO${x},${y}\n`;
    out += `${fontSpec(p.font, p.characterHeight, p.characterWidth)}\n`;
    out += `^FB${Math.round(node.box.width)},1000,0,${horizFlag(p.align?.h)},0\n`;
    out += `^SN${p.format},${inc},${lz}^FS\n`;
    return out;
  },
};
