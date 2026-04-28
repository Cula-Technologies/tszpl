import { describe, expect, test } from 'vitest';
import * as base64 from '../src/base64.js';

describe('base64', () => {
  test('decodes known font bit strings to expected bit lengths', () => {
    // Font A glyph "0": 7 * 12 = 84 bits (plus padding to 8-byte boundary)
    const bits = base64.decode('efs379meGAAAAA==');
    expect(bits.length).toBeGreaterThanOrEqual(84);
    expect(bits.every((b) => b === 0 || b === 1)).toBe(true);
  });

  test('encode → decode round-trips aligned bit arrays', () => {
    const bits = [1, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1];
    const encoded = base64.encode(bits);
    const decoded = base64.decode(encoded).slice(0, bits.length);
    expect(decoded).toEqual(bits);
  });

  test('encode produces the known font A glyph "0" string from its bit pattern', () => {
    const bits = base64.decode('efs379meGAAAAA==');
    // Re-encoding the first 84 bits (the glyph payload) should yield the same prefix.
    const reEncoded = base64.encode(bits.slice(0, 84));
    expect('efs379meGAAAAA=='.startsWith(reEncoded.slice(0, 14))).toBe(true);
  });
});
