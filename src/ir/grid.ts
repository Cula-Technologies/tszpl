import type { Component, PositionedProps, InvertibleProps, BorderedProps } from './common.js';
import type { Size, SizeOrNumber, SpacingInput } from '../layout/size.js';
import type { IRNode } from './index.js';

export interface GridProps extends PositionedProps, InvertibleProps, BorderedProps {
  readonly columns: readonly SizeOrNumber[];
  readonly rows: readonly (SizeOrNumber | Size)[];
  readonly columnSpacing?: number;
  readonly rowSpacing?: number;
  readonly padding?: SpacingInput;
  readonly children?: readonly IRNode[];
}

export type GridNode = Component<'grid', GridProps>;
