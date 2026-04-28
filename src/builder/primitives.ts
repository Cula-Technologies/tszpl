import type { IRNode } from '../ir/index.js';
import type { TextProps } from '../ir/text.js';
import type { BoxProps } from '../ir/box.js';
import type { LineProps } from '../ir/line.js';
import type { CircleProps } from '../ir/circle.js';
import type { GridProps } from '../ir/grid.js';
import type { BarcodeProps } from '../ir/barcode.js';
import type { GraphicProps } from '../ir/graphic.js';
import type { UnicodeTextProps } from '../ir/unicode-text.js';
import type { SerialProps } from '../ir/serial.js';
import type { RawProps } from '../ir/raw.js';

export interface ChildBuilder<Self> {
  text(props: TextProps): Self;
  box(props: Omit<BoxProps, 'children'>, fn?: (b: InnerBuilder) => void): Self;
  line(props: LineProps): Self;
  circle(props: Omit<CircleProps, 'children'>, fn?: (b: InnerBuilder) => void): Self;
  grid(props: Omit<GridProps, 'children'>, fn?: (b: InnerBuilder) => void): Self;
  barcode(props: BarcodeProps): Self;
  graphic(props: GraphicProps): Self;
  unicodeText(props: UnicodeTextProps): Self;
  serial(props: SerialProps): Self;
  raw(props: RawProps): Self;
  add(...nodes: IRNode[]): Self;
}

export type InnerBuilder = ChildBuilder<InnerBuilder>;

const makeInner = (sink: (n: IRNode) => void): InnerBuilder => {
  const inner = {} as InnerBuilder;
  Object.assign(inner, makeChildBuilder<InnerBuilder>(inner, sink));
  return inner;
};

export const makeChildBuilder = <Self>(self: Self, sink: (n: IRNode) => void): ChildBuilder<Self> => {
  const builder: ChildBuilder<Self> = {
    text(props) {
      sink({ kind: 'text', props });
      return self;
    },
    box(props, fn) {
      const children: IRNode[] = [];
      if (fn) fn(makeInner((n) => children.push(n)));
      sink({ kind: 'box', props: { ...props, children } });
      return self;
    },
    line(props) {
      sink({ kind: 'line', props });
      return self;
    },
    circle(props, fn) {
      const children: IRNode[] = [];
      if (fn) fn(makeInner((n) => children.push(n)));
      sink({ kind: 'circle', props: { ...props, children } });
      return self;
    },
    grid(props, fn) {
      const children: IRNode[] = [];
      if (fn) fn(makeInner((n) => children.push(n)));
      sink({ kind: 'grid', props: { ...props, children } });
      return self;
    },
    barcode(props) {
      sink({ kind: 'barcode', props });
      return self;
    },
    graphic(props) {
      sink({ kind: 'graphic', props });
      return self;
    },
    unicodeText(props) {
      sink({ kind: 'unicodeText', props });
      return self;
    },
    serial(props) {
      sink({ kind: 'serial', props });
      return self;
    },
    raw(props) {
      sink({ kind: 'raw', props });
      return self;
    },
    add(...nodes) {
      for (const n of nodes) sink(n);
      return self;
    },
  };
  return builder;
};
