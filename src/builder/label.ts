import type { IRNode } from '../ir/index.js';
import type { LabelNode, LabelProps } from '../ir/label.js';
import { makeChildBuilder, type ChildBuilder } from './primitives.js';

export interface LabelBuilder extends ChildBuilder<LabelBuilder> {
  build(): LabelNode;
}

export const label = (opts: Omit<LabelProps, 'children'>): LabelBuilder => {
  const children: IRNode[] = [];
  const builder = {
    build(): LabelNode {
      return { kind: 'label', props: { ...opts, children } };
    },
  } as LabelBuilder;
  Object.assign(
    builder,
    makeChildBuilder<LabelBuilder>(builder, (n) => children.push(n)),
  );
  return builder;
};
