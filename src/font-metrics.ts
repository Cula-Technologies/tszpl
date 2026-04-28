import type { FontFamily } from './ir/text.js';

// Default cell dimensions for ZPL II built-in fonts (height × width in dots).
// Source: Zebra ZPL II Programming Guide, "Fonts Provided" table.
export interface FontMetric {
  readonly height: number;
  readonly width: number;
}

export const DEFAULT_FONT_METRICS: Readonly<Record<FontFamily, FontMetric>> = {
  A: { height: 9, width: 5 },
  B: { height: 11, width: 7 },
  D: { height: 18, width: 10 },
  E: { height: 28, width: 15 },
  F: { height: 26, width: 13 },
};

export const fontMetric = (font: FontFamily, override?: { height?: number; width?: number }): FontMetric => {
  const base = DEFAULT_FONT_METRICS[font];
  return {
    height: override?.height && override.height > 0 ? override.height : base.height,
    width: override?.width && override.width > 0 ? override.width : base.width,
  };
};
