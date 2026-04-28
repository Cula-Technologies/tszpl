import type { Component, OffsetProps, InvertibleProps } from './common.js';

export interface LineProps extends OffsetProps, InvertibleProps {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly thickness: number;
}

export type LineNode = Component<'line', LineProps>;
