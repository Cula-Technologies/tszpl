import { describe, expect, test } from 'vitest';
import {
  Alignment,
  AlignmentValue,
  Barcode,
  BarcodeType,
  BarcodeTypeName,
  Box,
  Circle,
  FontFamily,
  FontFamilyName,
  Grid,
  Label,
  Line,
  PrintDensity,
  PrintDensityName,
  Raw,
  SerialNumber,
  Size,
  SizeType,
  Spacing,
  Text,
} from '../src/index.js';

function fresh(): Label {
  const label = new Label();
  label.printDensity = new PrintDensity(PrintDensityName['8dpmm']);
  label.width = 100;
  label.height = 50;
  label.padding = new Spacing(10);
  return label;
}

describe('async rendering', () => {
  test('Label.generateZPL emits expected output for plain text', async () => {
    const label = fresh();
    const text = new Text();
    label.add(text);
    text.fontFamily = new FontFamily(FontFamilyName.D);
    text.text = 'Hello World!';

    const zpl = await label.generateZPL();
    expect(zpl).toContain('^FDHello World!^FS');
    expect(zpl.startsWith('^XA')).toBe(true);
    expect(zpl.endsWith('^XZ')).toBe(true);
  });

  test('complex grid label renders without error', async () => {
    const label = fresh();

    const grid = new Grid();
    label.add(grid);
    grid.columns.push(new Size(1, SizeType.Relative));
    grid.columns.push(new Size(1, SizeType.Relative));
    grid.rows.push(new Size(1, SizeType.Relative));
    grid.rows.push(new Size(1, SizeType.Relative));
    grid.border = 2;
    grid.padding = new Spacing(5);

    const txt = new Text();
    txt.fontFamily = new FontFamily(FontFamilyName.D);
    txt.text = 'cell0';
    txt.horizontalAlignment = new Alignment(AlignmentValue.Center);
    grid.add(txt);

    const box = new Box();
    box.fill = true;
    box.width = 30;
    box.height = 30;
    box.grid.column = 1;
    grid.add(box);

    const circle = new Circle();
    circle.border = 2;
    circle.width = 40;
    circle.height = 40;
    circle.grid.row = 1;
    grid.add(circle);

    const raw = new Raw();
    raw.data = '^FO5,5^GB10,10,10^FS';
    label.add(raw);

    const line = new Line();
    line.x1 = 10;
    line.y1 = 10;
    line.x2 = 100;
    line.y2 = 100;
    line.thickness = 3;
    label.add(line);

    const zpl = await label.generateZPL();
    expect(zpl).toContain('^FDcell0');
    expect(zpl).toContain('^FO5,5^GB10,10,10^FS');
  });

  test('barcode label renders', async () => {
    const label = fresh();
    const barcode = new Barcode();
    label.add(barcode);
    barcode.data = '5901234123457';
    barcode.width = 200;
    barcode.height = 50;
    barcode.type = new BarcodeType(BarcodeTypeName.EAN13);

    const zpl = await label.generateZPL();
    expect(zpl).toContain('^BEN');
    expect(zpl).toContain('^FD5901234123457^FS');
  });

  test('serial number renders', async () => {
    const label = fresh();
    const sn = new SerialNumber();
    label.add(sn);
    sn.fontFamily = new FontFamily(FontFamilyName.D);
    sn.format = 'A0001';
    sn.increment = 2;
    sn.printLeadingZeroes = true;

    const zpl = await label.generateZPL();
    expect(zpl).toContain('^SNA0001,2,Y^FS');
  });

  test('async-only extension contributes to async output', async () => {
    class DelayedText extends Text {
      override async generateZPL(
        offsetLeft?: number,
        offsetTop?: number,
        availableWidth?: number,
        availableHeight?: number,
        widthUnits?: number,
        heightUnits?: number,
      ): Promise<string> {
        await Promise.resolve();
        const base = await super.generateZPL(
          offsetLeft,
          offsetTop,
          availableWidth,
          availableHeight,
          widthUnits,
          heightUnits,
        );
        return base + '^FX async-marker^FS\n';
      }
    }

    const label = fresh();
    const delayed = new DelayedText();
    delayed.fontFamily = new FontFamily(FontFamilyName.D);
    delayed.text = 'Hi';
    label.add(delayed);

    const zpl = await label.generateZPL();
    expect(zpl.includes('^FX async-marker^FS')).toBe(true);
  });
});
