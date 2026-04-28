import { BaseContainerComponent, type ContainerSizing } from './base-container-component.js';
import { Box } from './box.js';
import { Size } from '../properties/size.js';
import { Spacing } from '../properties/spacing.js';
import { SizeType } from '../enums/size-type.js';
import { BaseVisualComponent, type SizeLike } from './base-visual-component.js';
import { UnicodeText } from './unicode-text.js';

export class Grid extends BaseContainerComponent {
  override typeName = 'Grid';

  columns: SizeLike[] = [];
  rows: SizeLike[] = [];

  columnSpacing = 0;
  rowSpacing = 0;

  override calculateSizing(
    availableWidth: number,
    availableHeight: number,
    _widthUnits?: number,
    _heightUnits?: number,
  ): ContainerSizing {
    const units = this.calculateUnits();

    const spacingLeft = this.margin.left;
    const spacingTop = this.margin.top;

    const spacingHorizontal = spacingLeft + this.margin.right;
    const spacingVertical = spacingTop + this.margin.bottom;

    const width = availableWidth - spacingHorizontal;
    const height = availableHeight - spacingVertical;

    const widthUnits = (width - units.absolute.width) / (units.relative.width || 1);
    const heightUnits = (height - units.absolute.height) / (units.relative.height || 1);

    return { spacingTop, spacingLeft, width, height, widthUnits, heightUnits };
  }

  generateChildren(availableWidth: number, availableHeight: number): Box {
    const columnDefinitions = this.columns;
    if (columnDefinitions.length === 0) {
      columnDefinitions.push(new Size(1, SizeType.Relative));
    }

    const rowDefinitions = this.rows;
    if (rowDefinitions.length === 0) {
      rowDefinitions.push(new Size(1, SizeType.Relative));
    }

    const units = {
      absolute: { width: 0, height: 0 },
      relative: { width: 0, height: 0 },
    };

    for (const cell of columnDefinitions) {
      if (typeof cell === 'object') {
        if (cell.sizeType === SizeType.Absolute) units.absolute.width += cell.value;
        else units.relative.width += cell.value;
      } else {
        units.absolute.width += cell;
      }
    }

    for (const cell of rowDefinitions) {
      if (typeof cell === 'object') {
        if (cell.sizeType === SizeType.Absolute) units.absolute.height += cell.value;
        else units.relative.height += cell.value;
      } else {
        units.absolute.height += cell;
      }
    }

    const borderSpacing = (this.border ?? 0) * 4;

    units.absolute.width += borderSpacing;
    units.absolute.height += borderSpacing;

    const absoluteWidth = availableWidth - borderSpacing - this.columnSpacing * (columnDefinitions.length + 1);
    const absoluteHeight = availableHeight - borderSpacing - this.rowSpacing * (rowDefinitions.length + 1);

    const widthUnits = (absoluteWidth - units.absolute.width) / (units.relative.width || 1);
    const heightUnits = (absoluteHeight - units.absolute.height) / (units.relative.height || 1);

    const content: Box[][] = [];
    const contentCells: Box[] = [];

    let top = this.rowSpacing;
    let unusedHeight = absoluteHeight + (this.border ?? 0) * 2;

    for (let y = 0; y < rowDefinitions.length; y++) {
      const rowCells: Box[] = [];
      content.push(rowCells);

      let unusedWidth = absoluteWidth + (this.border ?? 0) * 2;
      let left = this.columnSpacing;

      const rowDef = rowDefinitions[y];
      if (rowDef === undefined) continue;

      let height = Math.ceil(this.getSize(rowDef, heightUnits)) + (this.border ?? 0);
      if (y === this.rows.length - 1) height = unusedHeight;
      unusedHeight -= height;

      for (let x = 0; x < this.columns.length; x++) {
        const cell = new Box();
        rowCells.push(cell);
        contentCells.push(cell);

        const colDef = columnDefinitions[x];
        if (colDef === undefined) continue;

        let width = Math.ceil(this.getSize(colDef, widthUnits)) + (this.border ?? 0);
        if (x === this.columns.length - 1) width = unusedWidth;
        unusedWidth -= width;

        cell.width = width;
        cell.height = height;
        cell.top = top;
        cell.left = left;
        cell.border = this.border ?? 0;
        cell.padding = this.padding;

        left += width + this.columnSpacing;
      }

      top += height + this.rowSpacing;
    }

    for (const element of this._content) {
      if (!(element instanceof BaseVisualComponent)) continue;
      if (!element.grid) continue;
      if (element.grid.row < 0 || element.grid.row >= rowDefinitions.length) continue;
      if (element.grid.column < 0 || element.grid.column >= columnDefinitions.length) continue;

      const row = content[element.grid.row];
      if (row === undefined) continue;
      const cell = row[element.grid.column];
      if (cell === undefined) continue;
      cell.add(element);
    }

    const contentBox = new Box();
    contentBox.add(...contentCells);
    contentBox.fixed = this.fixed;
    contentBox.width = this.width;
    contentBox.height = this.height;
    contentBox.border = this.border ?? 0;
    contentBox.invert = this.invert;
    contentBox.padding = new Spacing();

    return contentBox;
  }

  private hasAutoRows(): boolean {
    return this.rows.some((r) => typeof r === 'object' && r.sizeType === SizeType.Auto);
  }

  private computeColumnWidths(availableWidth: number): number[] {
    const cols: SizeLike[] = this.columns.length === 0 ? [new Size(1, SizeType.Relative)] : this.columns;

    let absolute = 0;
    let relative = 0;
    for (const c of cols) {
      if (typeof c === 'object') {
        if (c.sizeType === SizeType.Absolute) absolute += c.value;
        else relative += c.value;
      } else {
        absolute += c;
      }
    }

    const borderSpacing = (this.border ?? 0) * 4;
    const totalAbs = availableWidth - borderSpacing - this.columnSpacing * (cols.length + 1);
    const widthUnits = (totalAbs - absolute) / (relative || 1);

    const widths: number[] = [];
    let unused = totalAbs + (this.border ?? 0) * 2;
    for (let i = 0; i < cols.length; i++) {
      let w = Math.ceil(this.getSize(cols[i]!, widthUnits)) + (this.border ?? 0);
      if (i === cols.length - 1) w = unused;
      unused -= w;
      widths.push(w);
    }
    return widths;
  }

  private async resolveAutoRowsAsync(availableWidth: number): Promise<SizeLike[] | null> {
    if (!this.hasAutoRows()) return null;

    const colWidths = this.computeColumnWidths(availableWidth);
    const resolved: SizeLike[] = [];

    for (let r = 0; r < this.rows.length; r++) {
      const def = this.rows[r]!;
      if (typeof def !== 'object' || def.sizeType !== SizeType.Auto) {
        resolved.push(def);
        continue;
      }

      let maxHeight = 0;
      for (const child of this._content) {
        if (!(child instanceof BaseVisualComponent)) continue;
        if (child.grid?.row !== r) continue;
        if (!(child instanceof UnicodeText)) continue;

        const colWidth = colWidths[child.grid.column] ?? 0;
        const innerWidth = colWidth - this.padding.horizontal - (this.border ?? 0) * 2;

        if (child.autoBreak && innerWidth > 0) {
          await child.autoBreakText(innerWidth);
        }
        const size = await child.calculateSize();
        if (size.height > maxHeight) maxHeight = size.height;
      }

      resolved.push(new Size(maxHeight + this.padding.vertical, SizeType.Absolute));
    }

    return resolved;
  }

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    const resolvedRows = await this.resolveAutoRowsAsync(position.width);
    const previousRows = this.rows;
    if (resolvedRows) this.rows = resolvedRows;

    try {
      const contentBox = this.generateChildren(position.width, position.height);
      const sizing = this.calculateSizing(availableWidth, availableHeight, widthUnits, heightUnits);

      return await contentBox.generateZPL(
        position.left,
        position.top,
        sizing.width,
        sizing.height,
        sizing.widthUnits,
        sizing.heightUnits,
      );
    } finally {
      if (resolvedRows) this.rows = previousRows;
    }
  }
}
