const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function encode(blocks: readonly number[]): string {
  const zeroCount = (6 - (blocks.length % 6)) % 6;
  const padded: number[] = [...blocks];
  for (let i = 0; i < zeroCount; i++) padded.push(0);

  const paddingCount = (24 - (padded.length % 24)) / 6;

  let out = '';
  for (let i = 0; i < padded.length; i += 6) {
    let value = 0;
    for (let x = 0; x < 6; x++) {
      const bit = padded[i + x] ?? 0;
      if (bit > 0) value += 1 << (5 - x);
    }
    out += BASE64_CHARS[value] ?? '';
  }
  for (let i = 0; i < paddingCount; i++) out += '=';
  return out;
}

export function decode(base64: string): number[] {
  const trimmed = base64.replace(/=/g, '');
  const blocks: number[] = [];
  for (const ch of trimmed) {
    const index = BASE64_CHARS.indexOf(ch);
    if (index < 0) continue;
    const bits = ('000000' + index.toString(2)).slice(-6);
    for (const b of bits) {
      blocks.push(b === '1' ? 1 : 0);
    }
  }
  return blocks;
}
