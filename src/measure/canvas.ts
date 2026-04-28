import type { MeasureRequest, MeasureResult, TextMeasurer } from '../layout/context.js';

const wrapLine = (ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string[] => {
  if (line === '' || ctx.measureText(line).width <= maxWidth) return [line];

  const words = line.split(' ');
  const out: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? current + ' ' + word : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }
    if (current) out.push(current);

    if (ctx.measureText(word).width > maxWidth) {
      let buf = '';
      for (const ch of [...word]) {
        const cand = buf + ch;
        if (ctx.measureText(cand).width <= maxWidth) {
          buf = cand;
        } else {
          if (buf) out.push(buf);
          buf = ch;
        }
      }
      current = buf;
    } else {
      current = word;
    }
  }
  if (current) out.push(current);
  return out;
};

const splitLines = (s: string): string[] => s.replace(/\r\n/g, '\n').split('\n');

const hashUrl = (url: string): string => {
  let h = 0;
  for (let i = 0; i < url.length; i++) h = (h * 31 + url.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

/**
 * Browser/DOM TextMeasurer using FontFace + Canvas. Requires `document` + `FontFace` globals.
 * Loads each fontUrl once and caches the FontFace.
 */
export class CanvasTextMeasurer implements TextMeasurer {
  private readonly loaded = new Map<string, string>(); // fontUrl -> font-family name

  async measure(req: MeasureRequest): Promise<MeasureResult> {
    const family = await this.ensureFont(req.fontUrl);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('CanvasTextMeasurer: 2D context unavailable');

    ctx.font = `${req.size}px "${family}"`;
    ctx.textBaseline = 'top';

    const inputLines = splitLines(req.text);
    const wrapped: string[] = [];
    for (const line of inputLines) {
      if (req.maxWidth && req.maxWidth > 0) {
        wrapped.push(...wrapLine(ctx, line, req.maxWidth));
      } else {
        wrapped.push(line);
      }
    }

    let widest = 0;
    for (const line of wrapped) {
      const w = ctx.measureText(line).width;
      if (w > widest) widest = w;
    }
    const totalH = wrapped.length === 0 ? 0 : wrapped.length * req.size;

    return {
      width: Math.ceil(widest),
      height: Math.ceil(totalH),
      wrappedLines: wrapped,
    };
  }

  private async ensureFont(fontUrl: string): Promise<string> {
    const cached = this.loaded.get(fontUrl);
    if (cached) return cached;

    const family = `tszpl-font-${hashUrl(fontUrl)}`;
    const face = new FontFace(family, `url(${fontUrl})`);
    await face.load();
    (document.fonts as unknown as { add: (f: FontFace) => void }).add(face);
    this.loaded.set(fontUrl, family);
    return family;
  }
}
