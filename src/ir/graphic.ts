import type { Component, PositionedProps, InvertibleProps, BorderedProps } from './common.js';

export interface GraphicData {
  readonly width: number;
  readonly height: number;
  readonly bits: readonly number[];
}

export interface GraphicProps extends PositionedProps, InvertibleProps, BorderedProps {
  readonly data: GraphicData;
}

export type GraphicNode = Component<'graphic', GraphicProps>;
