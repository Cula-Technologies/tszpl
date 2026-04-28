import type { Component, PositionedProps, InvertibleProps, AlignmentProps } from './common.js';

export type FontFamily = 'A' | 'B' | 'D' | 'E' | 'F';

export interface TextProps extends PositionedProps, InvertibleProps, AlignmentProps {
  readonly text: string;
  readonly font: FontFamily;
  readonly characterWidth?: number;
  readonly characterHeight?: number;
  readonly lineSpacing?: number;
  readonly autoBreak?: boolean;
}

export type TextNode = Component<'text', TextProps>;
