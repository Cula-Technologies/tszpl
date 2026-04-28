export class GraphicData {
  readonly typeName = 'GraphicData';

  width: number;
  height: number;
  data: readonly number[];

  constructor(width?: number, height?: number, data?: readonly number[]) {
    this.width = width ?? 0;
    this.height = height ?? 0;
    this.data = data ?? [];
  }

  toString(): string {
    return `${this.width} x ${this.height}`;
  }
}
