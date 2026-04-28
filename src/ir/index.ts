import type { LabelNode } from './label.js';
import type { TextNode } from './text.js';
import type { BoxNode } from './box.js';
import type { LineNode } from './line.js';
import type { CircleNode } from './circle.js';
import type { GridNode } from './grid.js';
import type { BarcodeNode } from './barcode.js';
import type { GraphicNode } from './graphic.js';
import type { UnicodeTextNode } from './unicode-text.js';
import type { SerialNode } from './serial.js';
import type { RawNode } from './raw.js';

export type IRNode =
  | LabelNode
  | TextNode
  | BoxNode
  | LineNode
  | CircleNode
  | GridNode
  | BarcodeNode
  | GraphicNode
  | UnicodeTextNode
  | SerialNode
  | RawNode;

export type IRKind = IRNode['kind'];
export type NodeOf<K extends IRKind> = Extract<IRNode, { kind: K }>;
export type PropsOf<K extends IRKind> = NodeOf<K>['props'];

export type ContainerKind = 'label' | 'box' | 'circle' | 'grid';
export const isContainer = (k: IRKind): k is ContainerKind =>
  k === 'label' || k === 'box' || k === 'circle' || k === 'grid';

export type { Component } from './common.js';
export type { LabelNode, LabelProps } from './label.js';
export type { TextNode, TextProps, FontFamily } from './text.js';
export type { BoxNode, BoxProps } from './box.js';
export type { LineNode, LineProps } from './line.js';
export type { CircleNode, CircleProps } from './circle.js';
export type { GridNode, GridProps } from './grid.js';
export type { BarcodeNode, BarcodeProps, BarcodeType, Code128Subset } from './barcode.js';
export type { GraphicNode, GraphicProps, GraphicData } from './graphic.js';
export type { UnicodeTextNode, UnicodeTextProps } from './unicode-text.js';
export type { SerialNode, SerialProps } from './serial.js';
export type { RawNode, RawProps } from './raw.js';
export type {
  Align,
  OffsetProps,
  PositionedProps,
  InvertibleProps,
  BorderedProps,
  FillableProps,
  AlignmentProps,
} from './common.js';
