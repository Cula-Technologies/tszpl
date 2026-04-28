import type { IRKind } from '../ir/index.js';
import type { Resolved, ResolvedNode } from '../layout/resolved.js';
import type { Density } from '../units.js';

export interface RenderCtx<TOut> {
  readonly density: Density;
  emit(child: ResolvedNode): Promise<TOut>;
}

export interface NodeRenderer<K extends IRKind, TOut> {
  readonly kind: K;
  emit(node: Resolved<K>, ctx: RenderCtx<TOut>): TOut | Promise<TOut>;
}

export interface Renderer<TOut> {
  use<K extends IRKind>(r: NodeRenderer<K, TOut>): this;
  render(root: ResolvedNode, opts?: { density?: Density }): Promise<TOut>;
}
