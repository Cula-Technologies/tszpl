import type { IRNode } from '../ir/index.js';
import type { LabelNode } from '../ir/label.js';
import type { TextNode } from '../ir/text.js';
import type { BoxNode } from '../ir/box.js';
import type { LineNode } from '../ir/line.js';
import type { CircleNode } from '../ir/circle.js';
import type { GridNode } from '../ir/grid.js';
import type { UnicodeTextNode } from '../ir/unicode-text.js';
import type { Size, SizeOrNumber, Spacing, SpacingInput } from './size.js';
import type { Box, Resolved, ResolvedNode } from './resolved.js';
import type { LayoutCtx, MeasureRequest, TextMeasurer } from './context.js';
import { toSpacing } from './size.js';
import { mmToDots } from '../units.js';
import { fontMetric } from '../font-metrics.js';

const splitInputLines = (s: string): string[] => s.replace(/\r\n/g, '\n').split('\n');

const wrapByCharCount = (text: string, charsPerLine: number): string[] => {
  if (charsPerLine <= 0) return splitInputLines(text);
  const out: string[] = [];
  for (const line of splitInputLines(text)) {
    if (line.length <= charsPerLine) {
      out.push(line);
      continue;
    }
    const words = line.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (candidate.length <= charsPerLine) {
        current = candidate;
        continue;
      }
      if (current) out.push(current);
      if (word.length > charsPerLine) {
        let buf = '';
        for (const ch of [...word]) {
          if ((buf + ch).length <= charsPerLine) {
            buf += ch;
          } else {
            if (buf) out.push(buf);
            buf = ch;
          }
        }
        current = buf;
      } else {
        current = word;
      }
    }
    if (current) out.push(current);
  }
  return out;
};

const distributeForAxis = (defs: readonly SizeOrNumber[], total: number, autoSizes?: readonly number[]): number[] => {
  let absolute = 0;
  let relativeSum = 0;
  let lastRelativeIdx = -1;
  defs.forEach((d, idx) => {
    if (typeof d === 'number') absolute += d;
    else if (d.type === 'absolute') absolute += d.value;
    else if (d.type === 'fraction') absolute += total * d.value;
    else if (d.type === 'relative') {
      relativeSum += d.value;
      lastRelativeIdx = idx;
    } else if (d.type === 'auto') absolute += autoSizes?.[idx] ?? 0;
  });
  const remaining = total - absolute;
  const unit = relativeSum > 0 ? remaining / relativeSum : 0;
  const out: number[] = [];
  let consumedRelative = 0;
  defs.forEach((d, idx) => {
    let w = 0;
    let isRelative = false;
    if (typeof d === 'number') w = d;
    else if (d.type === 'absolute') w = d.value;
    else if (d.type === 'fraction') w = total * d.value;
    else if (d.type === 'relative') {
      w = unit * d.value;
      isRelative = true;
    } else if (d.type === 'auto') w = autoSizes?.[idx] ?? 0;
    w = Math.floor(w);
    if (isRelative) consumedRelative += w;
    if (idx === lastRelativeIdx) {
      const target = Math.floor(remaining);
      w += target - consumedRelative;
      consumedRelative = target;
    }
    out.push(w);
  });
  return out;
};

const resolveAxis = (size: SizeOrNumber | undefined, parent: number, fallback: number): number => {
  if (size === undefined) return fallback;
  if (typeof size === 'number') return size;
  switch (size.type) {
    case 'absolute':
      return size.value;
    case 'fraction':
      if (size.value < 0 || size.value > 1) throw new Error('Size.fraction must be in [0,1]');
      return parent * size.value;
    case 'relative':
      throw new Error('Size.relative is only valid in Grid');
    case 'auto':
      throw new Error('Size.auto is only valid for Grid rows');
  }
};

const resolveOffset = (size: SizeOrNumber | undefined, parent: number): number => {
  if (size === undefined) return 0;
  if (typeof size === 'number') return size;
  switch (size.type) {
    case 'absolute':
      return size.value;
    case 'fraction':
      return parent * size.value;
    default:
      throw new Error(`Size.${size.type} not valid for offset`);
  }
};

export interface LayoutEngine {
  resolve(root: IRNode, ctx: LayoutCtx): Promise<ResolvedNode>;
}

export class DefaultLayoutEngine implements LayoutEngine {
  async resolve(root: IRNode, ctx?: LayoutCtx): Promise<ResolvedNode> {
    if (root.kind !== 'label') {
      throw new Error(`Layout root must be a label, got '${root.kind}'`);
    }
    return this.resolveLabel(root, ctx?.measure);
  }

  private async resolveLabel(node: LabelNode, measure: TextMeasurer | undefined): Promise<Resolved<'label'>> {
    const widthDots = mmToDots(node.props.width, node.props.density);
    const heightDots = mmToDots(node.props.height, node.props.density);
    const padding = toSpacing(node.props.padding);

    const labelBox: Box = { left: 0, top: 0, width: widthDots, height: heightDots };
    const innerBox: Box = {
      left: padding.left,
      top: padding.top,
      width: widthDots - padding.left - padding.right,
      height: heightDots - padding.top - padding.bottom,
    };

    const children: ResolvedNode[] = [];
    for (const c of node.props.children ?? []) {
      children.push(await this.resolveChild(c, innerBox, measure));
    }
    return { kind: 'label', source: node, box: labelBox, children };
  }

  private async resolveChild(node: IRNode, parent: Box, measure: TextMeasurer | undefined): Promise<ResolvedNode> {
    switch (node.kind) {
      case 'text':
        return this.resolveText(node, parent);
      case 'box':
        return this.resolveBox(node, parent, measure);
      case 'line':
        return this.resolveLine(node, parent);
      case 'circle':
        return this.resolveCircle(node, parent, measure);
      case 'barcode':
        return { kind: 'barcode', source: node, box: this.computeBox(node.props, parent), children: [] };
      case 'graphic':
        return { kind: 'graphic', source: node, box: this.computeBox(node.props, parent), children: [] };
      case 'serial':
        return { kind: 'serial', source: node, box: this.computeBox(node.props, parent), children: [] };
      case 'unicodeText':
        return this.resolveUnicodeText(node, parent, measure);
      case 'grid':
        return this.resolveGrid(node, parent, measure);
      case 'raw':
        return { kind: 'raw', source: node, box: parent, children: [] };
      case 'label':
        throw new Error('label cannot be nested');
    }
  }

  private resolveText(node: TextNode, parent: Box): Resolved<'text'> {
    const box = this.computeBox(node.props, parent);
    if (!node.props.autoBreak) {
      return { kind: 'text', source: node, box, children: [] };
    }
    const metric = fontMetric(node.props.font, {
      ...(node.props.characterHeight !== undefined ? { height: node.props.characterHeight } : {}),
      ...(node.props.characterWidth !== undefined ? { width: node.props.characterWidth } : {}),
    });
    const charsPerLine = Math.max(0, Math.floor(box.width / Math.max(1, metric.width)));
    const wrappedLines = wrapByCharCount(node.props.text, charsPerLine);
    return { kind: 'text', source: node, box, children: [], extras: { wrappedLines } };
  }

  private async resolveBox(node: BoxNode, parent: Box, measure: TextMeasurer | undefined): Promise<Resolved<'box'>> {
    const box = this.computeBox(node.props, parent);
    const border = node.props.border ?? 0;
    const padding = toSpacing(node.props.padding);
    const innerBox: Box = {
      left: box.left + border + padding.left,
      top: box.top + border + padding.top,
      width: box.width - 2 * border - padding.left - padding.right,
      height: box.height - 2 * border - padding.top - padding.bottom,
    };
    const children: ResolvedNode[] = [];
    for (const c of node.props.children ?? []) {
      children.push(await this.resolveChild(c, innerBox, measure));
    }
    return { kind: 'box', source: node, box, children };
  }

  private resolveLine(node: LineNode, parent: Box): Resolved<'line'> {
    const margin = toSpacing(node.props.margin);
    const offsetLeft = resolveOffset(node.props.left, parent.width);
    const offsetTop = resolveOffset(node.props.top, parent.height);
    const left = Math.round(node.props.fixed ? offsetLeft : parent.left + margin.left + offsetLeft);
    const top = Math.round(node.props.fixed ? offsetTop : parent.top + margin.top + offsetTop);
    const width = Math.abs(node.props.x1 - node.props.x2);
    const height = Math.abs(node.props.y1 - node.props.y2);
    return { kind: 'line', source: node, box: { left, top, width, height }, children: [] };
  }

  private async resolveCircle(
    node: CircleNode,
    parent: Box,
    measure: TextMeasurer | undefined,
  ): Promise<Resolved<'circle'>> {
    const box = this.computeBox(node.props, parent);
    const border = node.props.border ?? 0;
    const padding = toSpacing(node.props.padding);
    const innerBox: Box = {
      left: box.left + border + padding.left,
      top: box.top + border + padding.top,
      width: box.width - 2 * border - padding.left - padding.right,
      height: box.height - 2 * border - padding.top - padding.bottom,
    };
    const children: ResolvedNode[] = [];
    for (const c of node.props.children ?? []) {
      children.push(await this.resolveChild(c, innerBox, measure));
    }
    return { kind: 'circle', source: node, box, children };
  }

  private async resolveUnicodeText(
    node: UnicodeTextNode,
    parent: Box,
    measure: TextMeasurer | undefined,
  ): Promise<Resolved<'unicodeText'>> {
    const box = this.computeBox(node.props, parent);
    if (!node.props.autoBreak) {
      return { kind: 'unicodeText', source: node, box, children: [] };
    }
    if (!measure) {
      throw new Error('UnicodeText.autoBreak requires LayoutCtx.measure (TextMeasurer)');
    }
    const result = await measure.measure({
      text: node.props.text,
      fontUrl: node.props.fontUrl,
      size: node.props.characterHeight ?? 22,
      maxWidth: box.width,
    });
    return {
      kind: 'unicodeText',
      source: node,
      box,
      children: [],
      extras: { wrappedLines: result.wrappedLines },
    };
  }

  private async resolveGrid(node: GridNode, parent: Box, measure: TextMeasurer | undefined): Promise<Resolved<'grid'>> {
    const box = this.computeBox(node.props, parent);
    const border = node.props.border ?? 0;
    const colSpacing = node.props.columnSpacing ?? 0;
    const rowSpacing = node.props.rowSpacing ?? 0;
    const padding = toSpacing(node.props.padding);

    const colDefs: readonly SizeOrNumber[] =
      node.props.columns.length === 0 ? [{ type: 'relative', value: 1 }] : node.props.columns;
    const rowDefs: readonly (SizeOrNumber | Size)[] =
      node.props.rows.length === 0 ? [{ type: 'relative', value: 1 }] : node.props.rows;

    for (const c of colDefs) {
      if (typeof c === 'object' && c.type === 'auto') {
        throw new Error('Size.auto is only valid for Grid rows, not columns');
      }
    }

    const innerWidth = box.width - 2 * border - colSpacing * (colDefs.length + 1);
    const innerHeight = box.height - 2 * border - rowSpacing * (rowDefs.length + 1);

    const colWidths = distributeForAxis(colDefs, innerWidth);

    const autoHeights = await this.measureAutoRows(node, rowDefs, colWidths, padding, border, measure);
    const rowHeights = distributeForAxis(rowDefs, innerHeight, autoHeights);

    const cells: Box[][] = [];
    let cellTop = box.top + border + rowSpacing;
    for (let r = 0; r < rowDefs.length; r++) {
      const rowH = rowHeights[r] ?? 0;
      const rowCells: Box[] = [];
      let cellLeft = box.left + border + colSpacing;
      for (let c = 0; c < colDefs.length; c++) {
        const colW = colWidths[c] ?? 0;
        rowCells.push({
          left: cellLeft + padding.left,
          top: cellTop + padding.top,
          width: colW - padding.left - padding.right,
          height: rowH - padding.top - padding.bottom,
        });
        cellLeft += colW + colSpacing;
      }
      cells.push(rowCells);
      cellTop += rowH + rowSpacing;
    }

    const children: ResolvedNode[] = [];
    for (let i = 0; i < (node.props.children ?? []).length; i++) {
      const child = (node.props.children ?? [])[i]!;
      const gp = (child as { props?: { grid?: { row: number; column: number } } }).props?.grid;
      if (!gp) {
        throw new Error(`Grid child[${i}] (kind=${child.kind}) missing 'grid: { row, column }' coordinate`);
      }
      if (gp.row < 0 || gp.row >= rowDefs.length || gp.column < 0 || gp.column >= colDefs.length) {
        throw new Error(
          `Grid child[${i}] (kind=${child.kind}) coord { row: ${gp.row}, column: ${gp.column} } out of bounds (rows=${rowDefs.length}, columns=${colDefs.length})`,
        );
      }
      const cell = cells[gp.row]![gp.column]!;
      children.push(await this.resolveChild(child, cell, measure));
    }
    return { kind: 'grid', source: node, box, children };
  }

  private async measureAutoRows(
    node: GridNode,
    rowDefs: readonly (SizeOrNumber | Size)[],
    colWidths: readonly number[],
    padding: Spacing,
    border: number,
    measure: TextMeasurer | undefined,
  ): Promise<number[] | undefined> {
    const hasAuto = rowDefs.some((r) => typeof r === 'object' && r.type === 'auto');
    if (!hasAuto) return undefined;

    const needsMeasurer = (node.props.children ?? []).some(
      (c) =>
        c.kind === 'unicodeText' &&
        c.props.grid &&
        rowDefs[c.props.grid.row] &&
        (rowDefs[c.props.grid.row] as Size).type === 'auto',
    );
    if (needsMeasurer && !measure) {
      throw new Error('Grid Size.auto requires LayoutCtx.measure (TextMeasurer)');
    }

    const autoHeights = new Array<number>(rowDefs.length).fill(0);
    for (let r = 0; r < rowDefs.length; r++) {
      const def = rowDefs[r];
      if (typeof def !== 'object' || def.type !== 'auto') continue;

      let max = 0;
      for (const child of node.props.children ?? []) {
        const gp = (child as { props?: { grid?: { row: number; column: number } } }).props?.grid;
        if (gp?.row !== r) continue;
        const colWidth = colWidths[gp.column] ?? 0;
        const innerWidth = colWidth - padding.left - padding.right - 2 * border;

        if (child.kind === 'unicodeText') {
          const req: MeasureRequest = {
            text: child.props.text,
            fontUrl: child.props.fontUrl,
            size: child.props.characterHeight ?? 22,
          };
          if (innerWidth > 0) (req as { maxWidth?: number }).maxWidth = innerWidth;
          const result = await measure!.measure(req);
          if (result.height > max) max = result.height;
        } else if (child.kind === 'text') {
          const metric = fontMetric(child.props.font, {
            ...(child.props.characterHeight !== undefined ? { height: child.props.characterHeight } : {}),
            ...(child.props.characterWidth !== undefined ? { width: child.props.characterWidth } : {}),
          });
          const charsPerLine = child.props.autoBreak
            ? Math.max(0, Math.floor(innerWidth / Math.max(1, metric.width)))
            : 0;
          const lines =
            charsPerLine > 0 ? wrapByCharCount(child.props.text, charsPerLine) : splitInputLines(child.props.text);
          const lineSpacing = child.props.lineSpacing ?? 0;
          const totalH = lines.length === 0 ? 0 : lines.length * metric.height + (lines.length - 1) * lineSpacing;
          if (totalH > max) max = totalH;
        }
      }
      autoHeights[r] = max + padding.top + padding.bottom;
    }
    return autoHeights;
  }

  private computeBox(
    props: {
      readonly width?: SizeOrNumber;
      readonly height?: SizeOrNumber;
      readonly left?: SizeOrNumber;
      readonly top?: SizeOrNumber;
      readonly margin?: SpacingInput;
      readonly fixed?: boolean;
    },
    parent: Box,
  ): Box {
    const margin = toSpacing(props.margin);
    const width = Math.round(resolveAxis(props.width, parent.width, parent.width - margin.left - margin.right));
    const height = Math.round(resolveAxis(props.height, parent.height, parent.height - margin.top - margin.bottom));
    const offsetLeft = resolveOffset(props.left, parent.width);
    const offsetTop = resolveOffset(props.top, parent.height);
    const left = Math.round(props.fixed ? offsetLeft : parent.left + margin.left + offsetLeft);
    const top = Math.round(props.fixed ? offsetTop : parent.top + margin.top + offsetTop);
    return { left, top, width, height };
  }
}
