import type { Component, PositionedProps, InvertibleProps, BorderedProps, FillableProps } from './common.js';
import type { SpacingInput } from '../layout/size.js';
import type { IRNode } from './index.js';

export interface BoxProps extends PositionedProps, InvertibleProps, BorderedProps, FillableProps {
  readonly cornerRadius?: number;
  readonly padding?: SpacingInput;
  readonly children?: readonly IRNode[];
}

export type BoxNode = Component<'box', BoxProps>;
