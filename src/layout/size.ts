export type Size =
  | { readonly type: 'absolute'; readonly value: number }
  | { readonly type: 'fraction'; readonly value: number }
  | { readonly type: 'relative'; readonly value: number }
  | { readonly type: 'auto' };

export const abs = (n: number): Size => ({ type: 'absolute', value: n });
export const frac = (n: number): Size => ({ type: 'fraction', value: n });
export const rel = (n = 1): Size => ({ type: 'relative', value: n });
export const auto = (): Size => ({ type: 'auto' });

export type SizeOrNumber = Size | number;

export const toSize = (v: SizeOrNumber): Size => (typeof v === 'number' ? abs(v) : v);

export interface Spacing {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

export type SpacingInput = Spacing | number;

export const spacing = (left = 0, top = left, right = left, bottom = top): Spacing => ({
  left,
  top,
  right,
  bottom,
});

export const noSpacing: Spacing = { left: 0, top: 0, right: 0, bottom: 0 };

export const toSpacing = (v: SpacingInput | undefined): Spacing => {
  if (v === undefined) return noSpacing;
  if (typeof v === 'number') return { left: v, top: v, right: v, bottom: v };
  return v;
};
