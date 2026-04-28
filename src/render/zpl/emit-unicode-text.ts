import type { NodeRenderer } from '../renderer.js';

const splitLines = (s: string): string[] => s.replace(/\r\n/g, '\n').split('\n');

const horizFlag = (h: 'start' | 'center' | 'end' | undefined): string =>
  h === 'center' ? 'C' : h === 'end' ? 'R' : 'L';

const lineSeparator = (h: 'start' | 'center' | 'end' | undefined): string => (h === 'center' ? '\\&' : '');

/**
 * Encodes a string for ZPL ^FH hex escape. Non-ASCII / underscore bytes become _XX (UTF-8).
 */
const encodeFH = (text: string): string => {
  const bytes = new TextEncoder().encode(text);
  let out = '';
  for (const b of bytes) {
    if (b >= 32 && b <= 126 && b !== 0x5f) {
      out += String.fromCharCode(b);
    } else {
      out += '_' + b.toString(16).toUpperCase().padStart(2, '0');
    }
  }
  return out;
};

export const unicodeTextEmitter: NodeRenderer<'unicodeText', string> = {
  kind: 'unicodeText',
  emit(node) {
    const p = node.source.props;
    const drive = p.fontDrive ?? 'E:';
    const charH = p.characterHeight ?? 22;
    const charW = p.characterWidth ?? 0;
    const lineSpacing = p.lineSpacing ?? 0;
    const lineStride = charH + lineSpacing;
    const lines = node.extras?.wrappedLines ?? splitLines(p.text);
    const totalH = lines.length === 0 ? 0 : lines.length * charH + (lines.length - 1) * lineSpacing;

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
      out += `^A@N,${charH},${charW},${drive}${p.printerFontName}\n`;
      out += `^FB${Math.round(node.box.width)},1000,0,${hFlag},0\n`;
      out += `^FH_^FD${encodeFH(line)}${sep}^FS\n`;
      dy += lineStride;
    }
    if (p.invert) out += '^LRN\n';
    return out;
  },
};
