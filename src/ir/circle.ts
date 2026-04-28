import type { Component, PositionedProps, InvertibleProps, BorderedProps, FillableProps } from './common.js';
import type { SpacingInput } from '../layout/size.js';
import type { IRNode } from './index.js';

export interface CircleProps extends PositionedProps, InvertibleProps, BorderedProps, FillableProps {
  readonly padding?: SpacingInput;
  readonly children?: readonly IRNode[];
}

export type CircleNode = Component<'circle', CircleProps>;
