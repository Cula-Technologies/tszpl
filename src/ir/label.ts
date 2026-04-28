import type { Component } from './common.js';
import type { Density, Mm } from '../units.js';
import type { SpacingInput } from '../layout/size.js';
import type { IRNode } from './index.js';

export interface LabelProps {
  readonly width: Mm;
  readonly height: Mm;
  readonly density: Density;
  readonly padding?: SpacingInput;
  readonly useUnicode?: boolean;
  readonly children: readonly IRNode[];
}

export type LabelNode = Component<'label', LabelProps>;
