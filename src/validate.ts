import type { IRNode, IRKind } from './ir/index.js';
import type { BarcodeType, Code128Subset } from './ir/barcode.js';
import type { FontFamily } from './ir/text.js';

export class IRValidationError extends Error {
  constructor(
    message: string,
    public readonly path: readonly string[],
  ) {
    super(`[${path.join('.')}] ${message}`);
    this.name = 'IRValidationError';
  }
}

const KNOWN_KINDS: ReadonlySet<IRKind> = new Set<IRKind>([
  'label',
  'text',
  'box',
  'line',
  'circle',
  'grid',
  'barcode',
  'graphic',
  'unicodeText',
  'serial',
  'raw',
]);

const BARCODE_TYPES: ReadonlySet<BarcodeType> = new Set<BarcodeType>([
  'Code11',
  'Interleaved25',
  'Code39',
  'PlanetCode',
  'PDF417',
  'EAN8',
  'UPCE',
  'Code93',
  'Code128',
  'EAN13',
  'Industrial25',
  'Standard25',
  'ANSICodabar',
  'Logmars',
  'MSI',
  'Plessey',
  'QRCode',
  'DataMatrix',
  'PostNet',
]);

const CODE128_SUBSETS: ReadonlySet<Code128Subset> = new Set<Code128Subset>(['A', 'B', 'C']);

const FONT_FAMILIES: ReadonlySet<FontFamily> = new Set<FontFamily>(['A', 'B', 'D', 'E', 'F']);

export const validate = (root: IRNode): void => {
  if (root.kind !== 'label') {
    throw new IRValidationError(`root must be a label, got '${String(root.kind)}'`, ['$']);
  }
  walk(root, ['$'], true);
};

const walk = (node: IRNode, path: readonly string[], isRoot: boolean): void => {
  if (!node || typeof node !== 'object') {
    throw new IRValidationError('node must be an object', path);
  }
  if (!KNOWN_KINDS.has(node.kind)) {
    throw new IRValidationError(`unknown kind '${String(node.kind)}'`, path);
  }
  if (typeof node.props !== 'object' || node.props === null) {
    throw new IRValidationError('props missing', path);
  }

  switch (node.kind) {
    case 'label': {
      if (!isRoot) throw new IRValidationError('label cannot be nested', path);
      if (!Number.isFinite(node.props.width)) throw new IRValidationError('width required (Mm)', path);
      if (!Number.isFinite(node.props.height)) throw new IRValidationError('height required (Mm)', path);
      if (![6, 8, 12, 24].includes(node.props.density))
        throw new IRValidationError('density must be 6 | 8 | 12 | 24', path);
      walkChildren(node.props.children ?? [], path);
      break;
    }
    case 'text': {
      if (typeof node.props.text !== 'string') throw new IRValidationError('text required (string)', path);
      if (!FONT_FAMILIES.has(node.props.font))
        throw new IRValidationError(`font must be one of A|B|D|E|F, got '${String(node.props.font)}'`, path);
      break;
    }
    case 'unicodeText': {
      if (typeof node.props.text !== 'string') throw new IRValidationError('text required (string)', path);
      if (typeof node.props.printerFontName !== 'string' || node.props.printerFontName.length === 0)
        throw new IRValidationError('printerFontName required', path);
      if (typeof node.props.fontUrl !== 'string' || node.props.fontUrl.length === 0)
        throw new IRValidationError('fontUrl required', path);
      break;
    }
    case 'raw': {
      if (typeof node.props.data !== 'string') throw new IRValidationError('data required (string)', path);
      break;
    }
    case 'barcode': {
      if (typeof node.props.data !== 'string' || node.props.data.length === 0)
        throw new IRValidationError('barcode data required', path);
      if (!BARCODE_TYPES.has(node.props.type))
        throw new IRValidationError(`unknown barcode type '${String(node.props.type)}'`, path);
      if (node.props.subset !== undefined && !CODE128_SUBSETS.has(node.props.subset))
        throw new IRValidationError(`Code128 subset must be A|B|C, got '${String(node.props.subset)}'`, path);
      if (node.props.subset !== undefined && node.props.type !== 'Code128')
        throw new IRValidationError(`subset only valid for Code128 (type='${node.props.type}')`, path);
      break;
    }
    case 'serial': {
      if (typeof node.props.format !== 'string' || node.props.format.length === 0)
        throw new IRValidationError('serial format required', path);
      if (!FONT_FAMILIES.has(node.props.font))
        throw new IRValidationError(`font must be one of A|B|D|E|F, got '${String(node.props.font)}'`, path);
      break;
    }
    case 'line': {
      const p = node.props;
      for (const k of ['x1', 'y1', 'x2', 'y2', 'thickness'] as const) {
        if (!Number.isFinite(p[k])) throw new IRValidationError(`line.${k} must be a finite number`, path);
      }
      break;
    }
    case 'graphic': {
      const d = node.props.data;
      if (!d || typeof d !== 'object') throw new IRValidationError('graphic.data required', path);
      if (!Number.isFinite(d.width) || d.width <= 0)
        throw new IRValidationError('graphic.data.width > 0 required', path);
      if (!Number.isFinite(d.height) || d.height <= 0)
        throw new IRValidationError('graphic.data.height > 0 required', path);
      if (!Array.isArray(d.bits)) throw new IRValidationError('graphic.data.bits must be an array', path);
      if (d.bits.length !== d.width * d.height)
        throw new IRValidationError(
          `graphic.data.bits length ${d.bits.length} !== width*height ${d.width * d.height}`,
          path,
        );
      break;
    }
    case 'box':
    case 'circle':
    case 'grid': {
      const children = (node.props as { children?: readonly IRNode[] }).children ?? [];
      walkChildren(children, path);
      break;
    }
  }
};

const walkChildren = (children: readonly IRNode[], path: readonly string[]): void => {
  children.forEach((child, idx) => walk(child, [...path, `children[${idx}]`], false));
};
