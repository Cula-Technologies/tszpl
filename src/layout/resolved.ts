import type { IRKind, NodeOf } from '../ir/index.js';

export interface Box {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface UnicodeTextExtras {
  readonly wrappedLines: readonly string[];
}

export interface TextExtras {
  readonly wrappedLines: readonly string[];
}

export type ResolvedExtras<K extends IRKind> = K extends 'unicodeText'
  ? UnicodeTextExtras
  : K extends 'text'
    ? TextExtras
    : never;

export interface Resolved<K extends IRKind> {
  readonly kind: K;
  readonly source: NodeOf<K>;
  readonly box: Box;
  readonly children: readonly ResolvedNode[];
  readonly extras?: ResolvedExtras<K>;
}

export type ResolvedNode = { [K in IRKind]: Resolved<K> }[IRKind];

export const isResolvedKind = <K extends IRKind>(
  node: ResolvedNode,
  kind: K,
): node is Extract<ResolvedNode, { kind: K }> => node.kind === kind;
