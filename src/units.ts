declare const __dot: unique symbol;
declare const __mm: unique symbol;

export type Dot = number & { readonly [__dot]: true };
export type Mm = number & { readonly [__mm]: true };

export const dot = (n: number): Dot => n as Dot;
export const mm = (n: number): Mm => n as Mm;

export type Density = 6 | 8 | 12 | 24;

export const mmToDots = (v: Mm, density: Density): Dot => Math.round((v as number) * density) as Dot;
