import type { SizeOrNumber, SpacingInput } from '../layout/size.js';

export type Align = 'start' | 'center' | 'end';

export interface OffsetProps {
  readonly left?: SizeOrNumber;
  readonly top?: SizeOrNumber;
  readonly margin?: SpacingInput;
  readonly fixed?: boolean;
  readonly grid?: { readonly column: number; readonly row: number };
}

export interface PositionedProps extends OffsetProps {
  readonly width?: SizeOrNumber;
  readonly height?: SizeOrNumber;
}

export interface InvertibleProps {
  readonly invert?: boolean;
}

export interface BorderedProps {
  readonly border?: number;
}

export interface FillableProps {
  readonly fill?: boolean;
}

export interface AlignmentProps {
  readonly align?: { readonly h?: Align; readonly v?: Align };
}

export interface Component<K extends string, P> {
  readonly kind: K;
  readonly props: Readonly<P>;
}
