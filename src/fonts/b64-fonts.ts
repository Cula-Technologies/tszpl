import { decode } from '../base64.js';
import type { FontFamilyValue } from '../enums/font-family-name.js';
import rawFonts from './zpl-fonts.json' with { type: 'json' };

export interface FontSpacing {
  right: number;
  left: number;
  top: number;
  bottom: number;
}

export interface FontSize {
  width: number;
  height: number;
}

export interface FontDefinition {
  name: string;
  spacing: FontSpacing;
  size: FontSize;
  base64: Readonly<Record<string, string>>;
  characters: Record<string, number[][]>;
}

interface RawFontDefinition {
  name: string;
  spacing: FontSpacing;
  size: FontSize;
  base64: Record<string, string>;
}

type FontTable = Record<string, FontDefinition>;

const RAW: Record<string, RawFontDefinition> = rawFonts;

const cache: Partial<FontTable> = {};

function initialize(raw: RawFontDefinition): FontDefinition {
  const characters: Record<string, number[][]> = {};
  for (const charKey of Object.keys(raw.base64)) {
    const encoded = raw.base64[charKey];
    if (encoded === undefined) continue;

    const blocks = decode(encoded);
    const rows: number[][] = [];

    for (let y = 0; y < raw.size.height; y++) {
      const row: number[] = [];
      for (let x = 0; x < raw.size.width; x++) {
        const index = y * raw.size.width + x;
        row.push(blocks[index] ?? 0);
      }
      rows.push(row);
    }

    characters[charKey] = rows;
  }

  return {
    name: raw.name,
    spacing: raw.spacing,
    size: raw.size,
    base64: raw.base64,
    characters,
  };
}

export function getFontDefinition(name: FontFamilyValue): FontDefinition {
  const cached = cache[name];
  if (cached !== undefined) return cached;

  const raw = RAW[name];
  if (raw === undefined) {
    throw new Error(`Unknown font family: ${name}`);
  }

  const def = initialize(raw);
  cache[name] = def;
  return def;
}

export function listFontNames(): readonly string[] {
  return Object.keys(RAW);
}
