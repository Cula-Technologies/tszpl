export abstract class BaseComponent {
  abstract typeName: string;

  abstract generateZPL(
    offsetLeft?: number,
    offsetTop?: number,
    availableWidth?: number,
    availableHeight?: number,
    widthUnits?: number,
    heightUnits?: number,
  ): Promise<string>;
}
