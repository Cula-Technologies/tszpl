import { Raw } from '../src/index.js';
import { createLabel } from './test-helpers.js';

const testHelpers = { createLabel };

test('add raw data to a label', async () => {
  const label = testHelpers.createLabel();

  const raw = new Raw();
  label.add(raw);
  raw.data = `^FO50,50^GB100,100,100^FS
^FO75,75^FR^GB100,100,100^FS
^FO93,93^GB40,40,40^FS`;

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO50,50^GB100,100,100^FS
^FO75,75^FR^GB100,100,100^FS
^FO93,93^GB40,40,40^FS
^XZ`);
});
