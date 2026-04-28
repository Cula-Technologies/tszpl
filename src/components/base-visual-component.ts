import { BaseComponent } from './base-component.js';
import { GridPosition } from '../properties/grid-position.js';
import { Size } from '../properties/size.js';
import { Spacing } from '../properties/spacing.js';
import { SizeType } from '../enums/size-type.js';

export interface Position {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface Units {
  absolute: { width: number; height: number };
  relative: { width: number; height: number };
}

export type SizeLike = number | Size;

export abstract class BaseVisualComponent extends BaseComponent {
  invert = false;
  fixed = false;

  grid: GridPosition = new GridPosition();

  width: SizeLike = new Size();
  height: SizeLike = new Size();

  top: SizeLike = new Size();
  left: SizeLike = new Size();

  margin: Spacing = new Spacing();

  border?: number;

  getPosition(
    offsetLeft: number,
    offsetTop: number,
    availableWidth: number,
    availableHeight: number,
    widthUnits?: number,
    heightUnits?: number,
  ): Position {
    let left = this.getSize(this.left, widthUnits) + this.margin.left;
    let top = this.getSize(this.top, heightUnits) + this.margin.top;

    const width = this.getSize(this.width, widthUnits) || availableWidth - this.margin.horizontal;
    const height = this.getSize(this.height, heightUnits) || availableHeight - this.margin.vertical;

    if (typeof this.top === 'object' && this.top.sizeType === SizeType.Fraction) {
      top = availableHeight * this.top.value;
    }
    if (typeof this.left === 'object' && this.left.sizeType === SizeType.Fraction) {
      left = availableWidth * this.left.value;
    }

    return {
      left: Math.round(left + offsetLeft),
      top: Math.round(top + offsetTop),
      width: Math.round(width),
      height: Math.round(height),
    };
  }

  getSize(prop: SizeLike, unitSize?: number): number {
    if (typeof prop === 'number') return prop;
    return prop.getValue(unitSize);
  }
}
