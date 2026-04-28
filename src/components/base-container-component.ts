import type { BaseComponent } from './base-component.js';
import { BaseVisualComponent } from './base-visual-component.js';
import type { Units } from './base-visual-component.js';
import { SizeType } from '../enums/size-type.js';
import { Spacing } from '../properties/spacing.js';

export interface ContainerSizing {
  spacingTop: number;
  spacingLeft: number;
  width: number;
  height: number;
  widthUnits: number;
  heightUnits: number;
}

export abstract class BaseContainerComponent extends BaseVisualComponent {
  padding: Spacing = new Spacing();
  protected _content: BaseComponent[] = [];

  get children(): readonly BaseComponent[] {
    return this._content;
  }

  add(...children: BaseComponent[]): this {
    this._content.push(...children);
    return this;
  }

  calculateUnits(): Units {
    const units: Units = {
      absolute: { width: 0, height: 0 },
      relative: { width: 0, height: 0 },
    };

    for (const element of this._content) {
      if (!(element instanceof BaseVisualComponent)) continue;
      if (!element.margin || !element.border || !element.width || !element.height) continue;

      units.absolute.width += element.margin.horizontal + (this.border ?? 0);
      units.absolute.height += element.margin.vertical + (this.border ?? 0);

      if (typeof element.border === 'number') {
        units.absolute.width += element.border * 2;
        units.absolute.height += element.border * 2;
      }

      if (typeof element.width === 'number') {
        units.absolute.width += element.width;
      } else if (element.width.sizeType === SizeType.Absolute) {
        units.absolute.width += element.width.value;
      } else {
        units.relative.width += element.width.value;
      }

      if (typeof element.height === 'number') {
        units.absolute.height += element.height;
      } else if (element.height.sizeType === SizeType.Absolute) {
        units.absolute.height += element.height.value;
      } else {
        units.relative.height += element.height.value;
      }
    }

    return units;
  }

  calculateSizing(
    availableWidth: number,
    availableHeight: number,
    _widthUnits?: number,
    _heightUnits?: number,
  ): ContainerSizing {
    const units = this.calculateUnits();

    const spacingLeft = this.margin.left + this.padding.left;
    const spacingTop = this.margin.top + this.padding.top;

    const spacingHorizontal = spacingLeft + this.margin.right + this.padding.right;
    const spacingVertical = spacingTop + this.margin.bottom + this.padding.right;

    const width = availableWidth - spacingHorizontal - (this.border ?? 0) * 2;
    const height = availableHeight - spacingVertical - (this.border ?? 0) * 2;

    const widthUnits = (width - units.absolute.width) / (units.relative.width || 1);
    const heightUnits = (height - units.absolute.height) / (units.relative.height || 1);

    return {
      spacingTop,
      spacingLeft,
      width,
      height,
      widthUnits,
      heightUnits,
    };
  }

  override async generateZPL(
    offsetLeft: number = 0,
    offsetTop: number = 0,
    availableWidth: number = 0,
    availableHeight: number = 0,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string> {
    const sizing = this.calculateSizing(availableWidth, availableHeight, widthUnits, heightUnits);

    let zpl = '';

    for (const element of this._content) {
      let left = offsetLeft + sizing.spacingLeft + (this.border ?? 0);
      let top = offsetTop + sizing.spacingTop + (this.border ?? 0);

      if (element instanceof BaseVisualComponent && element.fixed) {
        left = this.getSize(element.left);
        top = this.getSize(element.top);
      }

      zpl += await element.generateZPL(left, top, sizing.width, sizing.height, sizing.widthUnits, sizing.heightUnits);
    }

    return zpl;
  }
}
