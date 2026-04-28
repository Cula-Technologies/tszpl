import type { Component, PositionedProps, InvertibleProps } from './common.js';

export type BarcodeType =
  | 'Code11'
  | 'Interleaved25'
  | 'Code39'
  | 'PlanetCode'
  | 'PDF417'
  | 'EAN8'
  | 'UPCE'
  | 'Code93'
  | 'Code128'
  | 'EAN13'
  | 'Industrial25'
  | 'Standard25'
  | 'ANSICodabar'
  | 'Logmars'
  | 'MSI'
  | 'Plessey'
  | 'QRCode'
  | 'DataMatrix'
  | 'PostNet';

export type Code128Subset = 'A' | 'B' | 'C';

export interface BarcodeProps extends PositionedProps, InvertibleProps {
  readonly data: string;
  readonly type: BarcodeType;
  readonly maxLength?: number;
  readonly subset?: Code128Subset;
  readonly interpretationLine?: boolean;
}

export type BarcodeNode = Component<'barcode', BarcodeProps>;
