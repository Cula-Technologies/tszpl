import { Grid, GridPosition, Raw, UnicodeText } from '../src/index.js';
import { createLabel } from './test-helpers.js';

test('label without UnicodeText does not emit ^CI28', async () => {
  const label = createLabel();

  const raw = new Raw();
  raw.data = '^FO50,50^GB10,10,10^FS';
  label.add(raw);

  const zpl = await label.generateZPL();

  expect(zpl).not.toContain('^CI28');
});

test('label with useUnicode=true emits ^CI28 right after ^XA', async () => {
  const label = createLabel();
  label.useUnicode = true;

  const raw = new Raw();
  raw.data = '^FO50,50^GB10,10,10^FS';
  label.add(raw);

  const zpl = await label.generateZPL();

  expect(zpl.startsWith('^XA\n^CI28\n')).toBe(true);
});

test('label auto-enables ^CI28 when a UnicodeText component is added', async () => {
  const label = createLabel();

  const unicodeText = new UnicodeText({
    text: 'Grüße',
    printerFontName: 'TT0003M_.TTF',
    fontUrl: 'about:blank',
  });
  // The default UnicodeText.generateZPL relies on `document` (browser-only);
  // stub it so the test focuses on the label's auto-detection behaviour.
  unicodeText.generateZPL = async () => '';
  label.add(unicodeText);

  const zpl = await label.generateZPL();

  expect(zpl.startsWith('^XA\n^CI28\n')).toBe(true);
});

test('label auto-enables ^CI28 when UnicodeText is nested inside a container', async () => {
  const label = createLabel();

  const grid = new Grid();
  grid.columns = [1];
  grid.rows = [1];
  label.add(grid);

  const unicodeText = new UnicodeText({
    text: 'Hello',
    printerFontName: 'TT0003M_.TTF',
    fontUrl: 'about:blank',
  });
  unicodeText.grid = new GridPosition();
  unicodeText.generateZPL = async () => '';
  grid.add(unicodeText);

  const zpl = await label.generateZPL();

  expect(zpl.startsWith('^XA\n^CI28\n')).toBe(true);
});
