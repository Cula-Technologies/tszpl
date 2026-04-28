import type { Component, PositionedProps, InvertibleProps, AlignmentProps } from './common.js';

export interface UnicodeTextProps extends PositionedProps, InvertibleProps, AlignmentProps {
  readonly text: string;
  readonly printerFontName: string;
  readonly fontUrl: string;
  readonly fontDrive?: string;
  readonly characterHeight?: number;
  readonly characterWidth?: number;
  readonly lineSpacing?: number;
  readonly autoBreak?: boolean;
}

export type UnicodeTextNode = Component<'unicodeText', UnicodeTextProps>;
