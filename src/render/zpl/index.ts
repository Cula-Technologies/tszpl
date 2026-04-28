import type { IRKind } from '../../ir/index.js';
import type { Resolved, ResolvedNode } from '../../layout/resolved.js';
import type { Density } from '../../units.js';
import type { NodeRenderer, RenderCtx, Renderer } from '../renderer.js';

type Erased = (node: ResolvedNode, ctx: RenderCtx<string>) => string | Promise<string>;

export class ZplRenderer implements Renderer<string> {
  private readonly emitters = new Map<IRKind, Erased>();

  use<K extends IRKind>(r: NodeRenderer<K, string>): this {
    const erased: Erased = (node, ctx) => {
      const typed = node as unknown as Resolved<K>;
      return r.emit(typed, ctx);
    };
    this.emitters.set(r.kind, erased);
    return this;
  }

  async render(root: ResolvedNode, opts?: { density?: Density }): Promise<string> {
    const density: Density = opts?.density ?? (root.kind === 'label' ? root.source.props.density : 8);
    return this.emitNode(root, density);
  }

  private async emitNode(node: ResolvedNode, density: Density): Promise<string> {
    const emitter = this.emitters.get(node.kind);
    if (!emitter) throw new Error(`No ZPL emitter registered for kind: ${node.kind}`);

    const ctx: RenderCtx<string> = {
      density,
      emit: (child) => this.emitNode(child, density),
    };
    return Promise.resolve(emitter(node, ctx));
  }
}
