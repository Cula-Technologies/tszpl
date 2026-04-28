export { mm, dot, mmToDots } from './units.js';
export type { Mm, Dot, Density } from './units.js';

export { abs, frac, rel, auto, toSize, spacing, noSpacing, toSpacing } from './layout/size.js';
export type { Size, SizeOrNumber, Spacing, SpacingInput } from './layout/size.js';

export { DEFAULT_FONT_METRICS, fontMetric } from './font-metrics.js';
export type { FontMetric } from './font-metrics.js';

export type {
  IRNode,
  IRKind,
  NodeOf,
  PropsOf,
  ContainerKind,
  Component,
  LabelNode,
  LabelProps,
  TextNode,
  TextProps,
  FontFamily,
  BoxNode,
  BoxProps,
  LineNode,
  LineProps,
  CircleNode,
  CircleProps,
  GridNode,
  GridProps,
  BarcodeNode,
  BarcodeProps,
  BarcodeType,
  Code128Subset,
  GraphicNode,
  GraphicProps,
  GraphicData,
  UnicodeTextNode,
  UnicodeTextProps,
  SerialNode,
  SerialProps,
  RawNode,
  RawProps,
  Align,
  OffsetProps,
  PositionedProps,
  InvertibleProps,
  BorderedProps,
  FillableProps,
  AlignmentProps,
} from './ir/index.js';
export { isContainer } from './ir/index.js';

export { label } from './builder/label.js';
export type { LabelBuilder } from './builder/label.js';
export { makeChildBuilder } from './builder/primitives.js';
export type { ChildBuilder, InnerBuilder } from './builder/primitives.js';

export type { Box, Resolved, ResolvedNode, ResolvedExtras, TextExtras, UnicodeTextExtras } from './layout/resolved.js';
export { CanvasTextMeasurer } from './measure/canvas.js';
export { isResolvedKind } from './layout/resolved.js';
export type { LayoutCtx, MeasureRequest, MeasureResult, TextMeasurer } from './layout/context.js';
export type { LayoutEngine } from './layout/engine.js';
export { DefaultLayoutEngine } from './layout/engine.js';

export type { Renderer, NodeRenderer, RenderCtx } from './render/renderer.js';
export { ZplRenderer } from './render/zpl/index.js';
export { createZplRenderer } from './render/zpl/factory.js';
export * as zplEmitters from './render/zpl/emitters.js';

export { validate, IRValidationError } from './validate.js';
