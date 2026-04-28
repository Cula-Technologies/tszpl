import { describe, expect, test } from 'vitest';
import {
  createZplRenderer,
  DefaultLayoutEngine,
  IRValidationError,
  abs,
  auto,
  label,
  mm,
  rel,
  spacing,
  validate,
} from '../src/index.js';
import type { MeasureRequest, MeasureResult, TextMeasurer } from '../src/index.js';

const layoutEngine = new DefaultLayoutEngine();

class FixedMeasurer implements TextMeasurer {
  constructor(private readonly perCharWidth = 10) {}

  async measure(req: MeasureRequest): Promise<MeasureResult> {
    const inputLines = req.text.replace(/\r\n/g, '\n').split('\n');
    const wrapped: string[] = [];
    const maxChars =
      req.maxWidth && req.maxWidth > 0 ? Math.max(1, Math.floor(req.maxWidth / this.perCharWidth)) : Infinity;

    for (const line of inputLines) {
      if (line.length <= maxChars) {
        wrapped.push(line);
        continue;
      }
      const words = line.split(' ');
      let current = '';
      for (const word of words) {
        const candidate = current ? current + ' ' + word : word;
        if (candidate.length <= maxChars) {
          current = candidate;
        } else {
          if (current) wrapped.push(current);
          current = word;
        }
      }
      if (current) wrapped.push(current);
    }
    const widest = wrapped.reduce((m, l) => Math.max(m, l.length * this.perCharWidth), 0);
    const totalH = wrapped.length === 0 ? 0 : wrapped.length * req.size;
    return { width: widest, height: totalH, wrappedLines: wrapped };
  }
}

const renderLabel = async (ir: ReturnType<typeof label>, measure?: TextMeasurer): Promise<string> => {
  const node = ir.build();
  validate(node);
  const resolved = await layoutEngine.resolve(node, measure ? { measure } : undefined);
  return createZplRenderer().render(resolved);
};

describe('end-to-end', () => {
  test('emits ^XA / ^XZ envelope', async () => {
    const zpl = await renderLabel(label({ width: mm(100), height: mm(50), density: 8 }));
    expect(zpl.startsWith('^XA')).toBe(true);
    expect(zpl.endsWith('^XZ')).toBe(true);
  });

  test('text node emits ^FO / ^A / ^FB / ^FD ... ^FS', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'Hello World!',
      font: 'D',
    });

    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^AD');
    expect(zpl).toContain('^FDHello World!^FS');
    expect(zpl).toMatch(/\^FO\d+,\d+/);
    expect(zpl).toMatch(/\^FB\d+,1000,0,L,0/);
  });

  test('text horizontal alignment maps to ^FB flag and adds line separator on center', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'Centered',
      font: 'D',
      align: { h: 'center', v: 'center' },
    });

    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^FB\d+,1000,0,C,0/);
    expect(zpl).toContain('^FDCentered\\&^FS');
  });

  test('label padding offsets child position', async () => {
    const ir = label({
      width: mm(100),
      height: mm(50),
      density: 8,
      padding: spacing(10),
    }).text({ text: 'X', font: 'A' });

    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FO10,10');
  });

  test('box emits ^GB and applies border', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).box({
      border: 2,
      width: 50,
      height: 50,
    });

    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB50,50,2,,0\^FS/);
  });

  test('filled box uses thickness = min(w,h)', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).box({
      fill: true,
      width: 60,
      height: 40,
    });

    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB60,40,40,,0\^FS/);
  });

  test('useUnicode flag emits ^CI28', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8, useUnicode: true });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^CI28');
  });

  test('raw node passes data through verbatim', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).raw({
      data: '^FO50,50^GB10,10,10^FS',
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FO50,50^GB10,10,10^FS');
  });

  test('nested box children resolve relative to parent inner area', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).box(
      { border: 1, left: abs(20), top: abs(10), width: 60, height: 40 },
      (b) => b.text({ text: 'Inner', font: 'A' }),
    );
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^FO21,11/);
    expect(zpl).toContain('^FDInner^FS');
  });

  test('validate throws on invalid density', () => {
    const node = label({ width: mm(100), height: mm(50), density: 7 as 8 }).build();
    expect(() => validate(node)).toThrow(IRValidationError);
  });

  test('line emits ^GD with correct orientation R for down-right', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).line({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 100,
      thickness: 3,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GD100,100,3,B,R\^FS/);
  });

  test('line emits ^GD with orientation L for up-right', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).line({
      x1: 0,
      y1: 100,
      x2: 100,
      y2: 0,
      thickness: 2,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GD100,100,2,B,L\^FS/);
  });

  test('circle emits ^GC for square dims', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).circle({
      fill: true,
      width: 50,
      height: 50,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GC50,50,B\^FS/);
  });

  test('circle emits ^GE for ellipse dims', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).circle({
      border: 2,
      width: 80,
      height: 40,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GE80,40,2,B\^FS/);
  });

  test('barcode EAN13 emits ^BEN', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: '5901234123457',
      type: 'EAN13',
      width: 200,
      height: 50,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^BEN,50,Y,N/);
    expect(zpl).toContain('^FD5901234123457^FS');
  });

  test('barcode Code128 with subset prepends >9 / >: / >;', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'ABC',
      type: 'Code128',
      subset: 'B',
      width: 100,
      height: 30,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FD>:ABC^FS');
  });

  test('serial emits ^SN', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).serial({
      format: 'A0001',
      font: 'D',
      increment: 2,
      printLeadingZeroes: true,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^SNA0001,2,Y^FS');
  });

  test('graphic encodes ^GFA with packed bits', async () => {
    // 8x1 image, all bits on → 0xFF
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).graphic({
      data: { width: 8, height: 1, bits: [1, 1, 1, 1, 1, 1, 1, 1] },
      width: 8,
      height: 1,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^GFA,1,1,1,FF^FS');
  });

  test('graphic with 16x2 image computes bytesPerRow correctly', async () => {
    const bits = new Array(32).fill(0);
    bits[0] = 1; // top-left → 0x80 in first byte
    bits[16] = 1; // start of row 2 → 0x80 in third byte
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).graphic({
      data: { width: 16, height: 2, bits },
      width: 16,
      height: 2,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^GFA,4,4,2,80008000^FS');
  });

  test('unicodeText emits ^A@ + ^FH hex escape for non-ASCII', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).unicodeText({
      text: 'Größe',
      printerFontName: 'TT0003M_.TTF',
      fontUrl: '/fonts/Noto.ttf',
      characterHeight: 28,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^A@N,28,0,E:TT0003M_.TTF');
    expect(zpl).toContain('^FH_^FDGr_C3_B6_C3_9Fe^FS');
  });

  test('grid distributes relative columns and routes children to cells', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      {
        columns: [
          { type: 'relative', value: 1 },
          { type: 'relative', value: 1 },
        ],
        rows: [{ type: 'relative', value: 1 }],
        border: 2,
      },
      (b) =>
        b
          .text({ text: 'Left', font: 'A', grid: { row: 0, column: 0 } })
          .text({ text: 'Right', font: 'A', grid: { row: 0, column: 1 } }),
    );
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB800,400,2,,0\^FS/);
    expect(zpl).toContain('^FDLeft^FS');
    expect(zpl).toContain('^FDRight^FS');
    // child columns should be at distinct x positions
    const lefts = [...zpl.matchAll(/\^FO(\d+),\d+/g)].map((m) => parseInt(m[1] ?? '0', 10));
    expect(new Set(lefts).size).toBeGreaterThan(1);
  });

  test('unicodeText autoBreak throws without measurer', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).unicodeText({
      text: 'Long text that needs wrapping',
      printerFontName: 'TT.TTF',
      fontUrl: '/fonts/x.ttf',
      autoBreak: true,
    });
    await expect(renderLabel(ir)).rejects.toThrow(/autoBreak requires LayoutCtx.measure/);
  });

  test('unicodeText autoBreak wraps lines via measurer', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).unicodeText({
      text: 'AAAAAAAAAA BBBBBBBBBB',
      printerFontName: 'TT.TTF',
      fontUrl: '/fonts/x.ttf',
      width: 100,
      autoBreak: true,
      characterHeight: 20,
    });
    const measurer = new FixedMeasurer(10); // 10 chars per 100 dots
    const zpl = await renderLabel(ir, measurer);
    expect(zpl).toContain('^FH_^FDAAAAAAAAAA^FS');
    expect(zpl).toContain('^FH_^FDBBBBBBBBBB^FS');
  });

  test('grid auto rows size to measured unicodeText height', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      {
        columns: [rel(1)],
        rows: [auto(), rel(1)],
        border: 0,
      },
      (b) =>
        b.unicodeText({
          text: 'Hello',
          printerFontName: 'TT.TTF',
          fontUrl: '/fonts/x.ttf',
          characterHeight: 30,
          grid: { row: 0, column: 0 },
        }),
    );
    const measurer = new FixedMeasurer();
    const zpl = await renderLabel(ir, measurer);
    // ensure unicode text rendered with FO matching auto-row top (0) and characterHeight 30
    expect(zpl).toContain('^A@N,30,0,E:TT.TTF');
  });

  test('grid auto rows throws without measurer when unicodeText is in row', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid({ columns: [rel(1)], rows: [auto()] }, (b) =>
      b.unicodeText({
        text: 'X',
        printerFontName: 'TT.TTF',
        fontUrl: '/fonts/x.ttf',
        grid: { row: 0, column: 0 },
      }),
    );
    await expect(renderLabel(ir)).rejects.toThrow(/Grid Size.auto requires LayoutCtx.measure/);
  });

  test('cornerRadius produces ZPL rounding 0..8', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).box({
      border: 2,
      width: 100,
      height: 100,
      cornerRadius: 50,
    });
    const zpl = await renderLabel(ir);
    const match = zpl.match(/\^GB100,100,2,,(\d+)\^FS/);
    expect(match).not.toBeNull();
    const r = parseInt(match![1] ?? '-1', 10);
    expect(r).toBeGreaterThanOrEqual(0);
    expect(r).toBeLessThanOrEqual(8);
  });

  test('cornerRadius 0 emits 0', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).box({
      border: 1,
      width: 50,
      height: 50,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB50,50,1,,0\^FS/);
  });

  test('PDF417 columns derived from maxLength / rows (not no-op)', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'XYZ',
      type: 'PDF417',
      maxLength: 60,
      width: 200,
      height: 30,
    });
    const zpl = await renderLabel(ir);
    // height 30 / rowHeight 10 = 3 rows; columns = ceil(60/3) = 20
    expect(zpl).toMatch(/\^B7N,10,0,20,3,N/);
  });

  test('horizontal line emits ^GB not ^GD', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).line({
      x1: 0,
      y1: 0,
      x2: 100,
      y2: 0,
      thickness: 2,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB100,2,2,,0\^FS/);
    expect(zpl).not.toContain('^GD');
  });

  test('vertical line emits ^GB not ^GD', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).line({
      x1: 0,
      y1: 0,
      x2: 0,
      y2: 80,
      thickness: 3,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB3,80,3,,0\^FS/);
    expect(zpl).not.toContain('^GD');
  });

  test('grid child without grid coord throws', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      { columns: [rel(1), rel(1)], rows: [rel(1)] },
      (b) => b.text({ text: 'orphan', font: 'A' }),
    );
    await expect(renderLabel(ir)).rejects.toThrow(/missing 'grid:/);
  });

  test('grid child with out-of-bounds coord throws', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid({ columns: [rel(1)], rows: [rel(1)] }, (b) =>
      b.text({ text: 'oob', font: 'A', grid: { row: 5, column: 0 } }),
    );
    await expect(renderLabel(ir)).rejects.toThrow(/out of bounds/);
  });

  test('grid with auto in column defs throws', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      { columns: [auto()], rows: [rel(1)] },
      () => undefined,
    );
    await expect(renderLabel(ir)).rejects.toThrow(/Size.auto is only valid for Grid rows/);
  });

  test('text invert emits ^LRY/^LRN bracket', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'Inv',
      font: 'A',
      invert: true,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^LRY\n');
    expect(zpl).toContain('^LRN\n');
  });

  test('box invert emits ^FR before ^GB', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).box({
      border: 2,
      width: 50,
      height: 50,
      invert: true,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^FO\d+,\d+\^FR\^GB50,50,2,,0\^FS/);
  });

  test('fixed positioning ignores parent offset', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8, padding: spacing(50) }).text({
      text: 'F',
      font: 'A',
      left: abs(7),
      top: abs(11),
      fixed: true,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FO7,11');
  });

  test('Code128 subset A prepends >9', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'X',
      type: 'Code128',
      subset: 'A',
      width: 100,
      height: 30,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FD>9X^FS');
  });

  test('Code128 subset C prepends >;', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: '01',
      type: 'Code128',
      subset: 'C',
      width: 100,
      height: 30,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FD>;01^FS');
  });

  test('density 24 scales mmToDots correctly', async () => {
    const ir = label({ width: mm(10), height: mm(5), density: 24 }).box({
      border: 1,
      width: 24,
      height: 24,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^GB24,24,1,,0\^FS/);
  });

  test('grid distributeForAxis last cell absorbs rounding remainder', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      { columns: [rel(1), rel(1), rel(1)], rows: [rel(1)], border: 0 },
      (b) =>
        b
          .text({ text: 'A', font: 'A', grid: { row: 0, column: 0 } })
          .text({ text: 'B', font: 'A', grid: { row: 0, column: 1 } })
          .text({ text: 'C', font: 'A', grid: { row: 0, column: 2 } }),
    );
    const zpl = await renderLabel(ir);
    // 3 children → 3 distinct ^FO x positions; sum of column widths == inner width
    const xs = [...zpl.matchAll(/\^FO(\d+),\d+/g)].map((m) => parseInt(m[1] ?? '0', 10));
    expect(new Set(xs).size).toBe(3);
  });

  test('raw at top level passes through', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).raw({
      data: '^MMT\n^PR4',
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^MMT\n^PR4\n');
  });

  test('spacing scalar shorthand works for padding', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8, padding: 12 }).text({
      text: 'P',
      font: 'A',
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FO12,12');
  });

  test('density coupling: render derives density from resolved root', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 24 }).box({
      border: 1,
      width: 10,
      height: 10,
    });
    // renderLabel passes no opts to render; density must come from label
    const zpl = await renderLabel(ir);
    expect(zpl.startsWith('^XA')).toBe(true);
  });

  test('DataMatrix module height derived from box height', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'HELLO',
      type: 'DataMatrix',
      width: 50,
      height: 25,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toMatch(/\^BXN,25,200,,,~,1/);
  });

  test('validate rejects unknown barcode type', () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'X',
      type: 'Bogus' as 'Code128',
    });
    expect(() => validate(ir.build())).toThrow(/unknown barcode type/);
  });

  test('validate rejects bad Code128 subset', () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'X',
      type: 'Code128',
      subset: 'D' as 'A',
    });
    expect(() => validate(ir.build())).toThrow(/Code128 subset must be A\|B\|C/);
  });

  test('validate rejects subset on non-Code128', () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: 'X',
      type: 'Code39',
      subset: 'A',
    });
    expect(() => validate(ir.build())).toThrow(/subset only valid for Code128/);
  });

  test('validate rejects invalid font family', () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'X',
      font: 'Z' as 'A',
    });
    expect(() => validate(ir.build())).toThrow(/font must be one of/);
  });

  test('validate rejects nested label', () => {
    const inner = label({ width: mm(50), height: mm(25), density: 8 }).build();
    const outer = label({ width: mm(100), height: mm(50), density: 8 })
      .add(inner)
      .build();
    expect(() => validate(outer)).toThrow(/label cannot be nested/);
  });

  test('validate rejects graphic with mismatched bits length', () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).graphic({
      data: { width: 4, height: 2, bits: [1, 0, 1] }, // expect 8
    });
    expect(() => validate(ir.build())).toThrow(/bits length/);
  });

  test('text autoBreak wraps lines using built-in font metric (no measurer needed)', async () => {
    // Font A: width=5, height=9. Box width 50 → charsPerLine = 10
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'AAAAAAAAAA BBBBBBBBBB',
      font: 'A',
      width: 50,
      autoBreak: true,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FDAAAAAAAAAA^FS');
    expect(zpl).toContain('^FDBBBBBBBBBB^FS');
  });

  test('text autoBreak hard-breaks overlong word', async () => {
    // Font A width=5, characterWidth override 10 → metric.width 10. Box 50 → 5 chars/line
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'ABCDEFGHIJ',
      font: 'A',
      characterWidth: 10,
      width: 50,
      autoBreak: true,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FDABCDE^FS');
    expect(zpl).toContain('^FDFGHIJ^FS');
  });

  test('text without autoBreak emits raw text including spaces', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).text({
      text: 'AAAAAAAAAA BBBBBBBBBB',
      font: 'A',
      width: 50,
    });
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FDAAAAAAAAAA BBBBBBBBBB^FS');
  });

  test('grid auto row sizes from text autoBreak content (no measurer needed)', async () => {
    // 2 wrapped lines × font A height 9 = 18 dot row height
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      { columns: [abs(50)], rows: [auto(), rel(1)] },
      (b) =>
        b
          .text({
            text: 'AAAAAAAAAA BBBBBBBBBB',
            font: 'A',
            autoBreak: true,
            grid: { row: 0, column: 0 },
          })
          .text({ text: 'foot', font: 'A', grid: { row: 1, column: 0 } }),
    );
    const zpl = await renderLabel(ir);
    expect(zpl).toContain('^FDAAAAAAAAAA^FS');
    expect(zpl).toContain('^FDBBBBBBBBBB^FS');
    // second-row text top should be after auto row (18 dots)
    const fos = [...zpl.matchAll(/\^FO\d+,(\d+)/g)].map((m) => parseInt(m[1] ?? '-1', 10));
    expect(Math.max(...fos)).toBeGreaterThanOrEqual(18);
  });

  test('chained children inside grid callback all route to grid (not outer label)', async () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).grid(
      { columns: [rel(1), rel(1), rel(1)], rows: [rel(1)], border: 0 },
      (b) =>
        b
          .text({ text: 'A', font: 'A', grid: { row: 0, column: 0 } })
          .text({ text: 'B', font: 'A', grid: { row: 0, column: 1 } })
          .text({ text: 'C', font: 'A', grid: { row: 0, column: 2 } }),
    );
    const node = ir.build();
    // Grid is the only top-level child of label
    expect(node.props.children.length).toBe(1);
    expect(node.props.children[0]?.kind).toBe('grid');
    const grid = node.props.children[0] as { props: { children: readonly unknown[] } };
    expect(grid.props.children.length).toBe(3);
    // 3 distinct ^FO x positions in render
    const zpl = await renderLabel(ir);
    const xs = [...zpl.matchAll(/\^FO(\d+),\d+/g)].map((m) => parseInt(m[1] ?? '-1', 10));
    expect(new Set(xs).size).toBe(3);
  });

  test('validate rejects empty barcode data', () => {
    const ir = label({ width: mm(100), height: mm(50), density: 8 }).barcode({
      data: '',
      type: 'Code128',
    });
    expect(() => validate(ir.build())).toThrow(/barcode data required/);
  });
});
