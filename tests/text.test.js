import { Text, SerialNumber, FontFamilyName, FontFamily, Alignment, AlignmentValue } from '../src/index.js';
import { createLabel } from './test-helpers.js';

const testHelpers = { createLabel };

test('add text to a label', async () => {
  const label = testHelpers.createLabel();

  const text = new Text();
  label.add(text);
  text.fontFamily = new FontFamily(FontFamilyName.D);
  text.text = 'Hello World!';

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO10,10^AD,,,
^FB780,1000,0,L,0
^FDHello World!^FS
^XZ`);
});

test('add multiline text to a label', async () => {
  const label = testHelpers.createLabel();

  const text = new Text();
  label.add(text);
  text.fontFamily = new FontFamily(FontFamilyName.D);
  text.text = 'Hello\n World!\nThis\nIs\nA\nNew\nLine';

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO10,10^AD,,,
^FB780,1000,0,L,0
^FDHello^FS
^FO10,31^AD,,,
^FB780,1000,0,L,0
^FD World!^FS
^FO10,52^AD,,,
^FB780,1000,0,L,0
^FDThis^FS
^FO10,73^AD,,,
^FB780,1000,0,L,0
^FDIs^FS
^FO10,94^AD,,,
^FB780,1000,0,L,0
^FDA^FS
^FO10,115^AD,,,
^FB780,1000,0,L,0
^FDNew^FS
^FO10,136^AD,,,
^FB780,1000,0,L,0
^FDLine^FS
^XZ`);
});

test('add text with alignment to a label', async () => {
  const label = testHelpers.createLabel();

  const textTopLeft = new Text();
  label.add(textTopLeft);
  textTopLeft.fontFamily = new FontFamily(FontFamilyName.D);
  textTopLeft.verticalAlignment = new Alignment(AlignmentValue.Start);
  textTopLeft.horizontalAlignment = new Alignment(AlignmentValue.Start);
  textTopLeft.text = 'Top Left';

  const textTopCenter = new Text();
  label.add(textTopCenter);
  textTopCenter.fontFamily = new FontFamily(FontFamilyName.D);
  textTopCenter.verticalAlignment = new Alignment(AlignmentValue.Start);
  textTopCenter.horizontalAlignment = new Alignment(AlignmentValue.Center);
  textTopCenter.text = 'Top Center';

  const textTopRight = new Text();
  label.add(textTopRight);
  textTopRight.fontFamily = new FontFamily(FontFamilyName.D);
  textTopRight.verticalAlignment = new Alignment(AlignmentValue.Start);
  textTopRight.horizontalAlignment = new Alignment(AlignmentValue.End);
  textTopRight.text = 'Top Right';

  const textCenterLeft = new Text();
  label.add(textCenterLeft);
  textCenterLeft.fontFamily = new FontFamily(FontFamilyName.D);
  textCenterLeft.verticalAlignment = new Alignment(AlignmentValue.Center);
  textCenterLeft.horizontalAlignment = new Alignment(AlignmentValue.Start);
  textCenterLeft.text = 'Center Left';

  const textCenterCenter = new Text();
  label.add(textCenterCenter);
  textCenterCenter.fontFamily = new FontFamily(FontFamilyName.D);
  textCenterCenter.verticalAlignment = new Alignment(AlignmentValue.Center);
  textCenterCenter.horizontalAlignment = new Alignment(AlignmentValue.Center);
  textCenterCenter.text = 'Center Center';

  const textCenterRight = new Text();
  label.add(textCenterRight);
  textCenterRight.fontFamily = new FontFamily(FontFamilyName.D);
  textCenterRight.verticalAlignment = new Alignment(AlignmentValue.Center);
  textCenterRight.horizontalAlignment = new Alignment(AlignmentValue.End);
  textCenterRight.text = 'Center Right';

  const textBottomLeft = new Text();
  label.add(textBottomLeft);
  textBottomLeft.fontFamily = new FontFamily(FontFamilyName.D);
  textBottomLeft.verticalAlignment = new Alignment(AlignmentValue.End);
  textBottomLeft.horizontalAlignment = new Alignment(AlignmentValue.Start);
  textBottomLeft.text = 'Bottom Left';

  const textBottomCenter = new Text();
  label.add(textBottomCenter);
  textBottomCenter.fontFamily = new FontFamily(FontFamilyName.D);
  textBottomCenter.verticalAlignment = new Alignment(AlignmentValue.End);
  textBottomCenter.horizontalAlignment = new Alignment(AlignmentValue.Center);
  textBottomCenter.text = 'Bottom Center';

  const textBottomRight = new Text();
  label.add(textBottomRight);
  textBottomRight.fontFamily = new FontFamily(FontFamilyName.D);
  textBottomRight.verticalAlignment = new Alignment(AlignmentValue.End);
  textBottomRight.horizontalAlignment = new Alignment(AlignmentValue.End);
  textBottomRight.text = 'Bottom Right';

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO10,10^AD,,,
^FB780,1000,0,L,0
^FDTop Left^FS
^FO10,10^AD,,,
^FB780,1000,0,C,0
^FDTop Center\\&^FS
^FO10,10^AD,,,
^FB780,1000,0,R,0
^FDTop Right^FS
^FO10,190^AD,,,
^FB780,1000,0,L,0
^FDCenter Left^FS
^FO10,190^AD,,,
^FB780,1000,0,C,0
^FDCenter Center\\&^FS
^FO10,190^AD,,,
^FB780,1000,0,R,0
^FDCenter Right^FS
^FO10,369^AD,,,
^FB780,1000,0,L,0
^FDBottom Left^FS
^FO10,369^AD,,,
^FB780,1000,0,C,0
^FDBottom Center\\&^FS
^FO10,369^AD,,,
^FB780,1000,0,R,0
^FDBottom Right^FS
^XZ`);
});

test('add scaled text to a label', async () => {
  const label = testHelpers.createLabel();

  const text = new Text();
  label.add(text);
  text.fontFamily = new FontFamily(FontFamilyName.D);

  text.text = 'Hello World!';
  text.characterHeight = 5;
  text.characterWidth = 30;

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO10,10^AD,5,30,
^FB780,1000,0,L,0
^FDHello World!^FS
^XZ`);
});

test('add serial number field with leading zeros to a label', async () => {
  const label = testHelpers.createLabel();

  const serialNumber = new SerialNumber();
  label.add(serialNumber);

  serialNumber.fontFamily = new FontFamily(FontFamilyName.D);
  serialNumber.format = 'A0001';
  serialNumber.increment = 2;
  serialNumber.printLeadingZeroes = true;

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO10,10^AD,,,
^FB780,1000,0,L,0
^SNA0001,2,Y^FS
^XZ`);
});

test('add serial number field without leading zeros to a label', async () => {
  const label = testHelpers.createLabel();

  const serialNumber = new SerialNumber();
  label.add(serialNumber);

  serialNumber.fontFamily = new FontFamily(FontFamilyName.D);
  serialNumber.format = '0001';
  serialNumber.increment = 1;
  serialNumber.printLeadingZeroes = false;

  const zpl = await label.generateZPL();

  expect(zpl).toBe(`^XA
^FO10,10^AD,,,
^FB780,1000,0,L,0
^SN0001,1,N^FS
^XZ`);
});
