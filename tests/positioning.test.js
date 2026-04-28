import { Text, FontFamilyName, FontFamily, Circle } from '../src/index.js';
import { createLabel } from './test-helpers.js';

const testHelpers = { createLabel };

test('add fixed positioning text to a label', async () => {
  const label = testHelpers.createLabel();

  const text = new Text();
  label.add(text);
  text.fontFamily = new FontFamily(FontFamilyName.D);
  text.text = 'Hello World!';
  text.fixed = true;

  text.top = 50;
  text.left = 150;

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO300,100^AD,,,
^FB780,1000,0,L,0
^FDHello World!^FS
^XZ`);
});

test('add fixed position circle to a label', async () => {
  const label = testHelpers.createLabel();

  const circle = new Circle();
  label.add(circle);
  circle.fill = true;
  circle.width = 150;
  circle.height = 150;
  circle.fixed = true;
  circle.left = 50;
  circle.top = 25;

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO100,50^GC150,150,B^FS
^XZ`);
});
