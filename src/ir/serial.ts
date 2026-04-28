import type { Component, PositionedProps, AlignmentProps } from './common.js';
import type { FontFamily } from './text.js';

export interface SerialProps extends PositionedProps, AlignmentProps {
  readonly format: string;
  readonly font: FontFamily;
  readonly increment?: number;
  readonly printLeadingZeroes?: boolean;
  readonly characterWidth?: number;
  readonly characterHeight?: number;
}

export type SerialNode = Component<'serial', SerialProps>;
