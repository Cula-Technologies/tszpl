export { SizeType, type SizeTypeValue } from './enums/size-type.js';
export { Rotation, type RotationValue } from './enums/rotation.js';
export { PrintDensityName, type PrintDensityValue } from './enums/print-density-name.js';
export { FontFamilyName, type FontFamilyValue } from './enums/font-family-name.js';
export { BarcodeTypeName, type BarcodeTypeValue } from './enums/barcode-type-name.js';
export { AlignmentValue, type AlignmentValueType } from './enums/alignment-value.js';

export { Size } from './properties/size.js';
export { Spacing } from './properties/spacing.js';
export { GridPosition } from './properties/grid-position.js';
export { FontFamily } from './properties/font-family.js';
export { Alignment } from './properties/alignment.js';
export { PrintDensity } from './properties/print-density.js';
export { GraphicData } from './properties/graphic-data.js';
export { BarcodeType } from './properties/barcode-type.js';

export { LabelTools, type LabelToolsType } from './helpers/label-tools.js';
export { ImageProcessor } from './helpers/image-processor.js';
export { ImageResizer } from './helpers/image-resizer.js';

export { BaseComponent } from './components/base-component.js';
export { BaseVisualComponent, type Position, type Units, type SizeLike } from './components/base-visual-component.js';
export { BaseContainerComponent, type ContainerSizing } from './components/base-container-component.js';
export { BaseGraphicComponent } from './components/base-graphic-component.js';

export { Label } from './components/label.js';
export { Text } from './components/text.js';
export { UnicodeText } from './components/unicode-text.js';
export { Grid } from './components/grid.js';
export { Box } from './components/box.js';
export { Line } from './components/line.js';
export { Circle } from './components/circle.js';
export { Graphic } from './components/graphic.js';
export { Barcode } from './components/barcode.js';
export { Raw } from './components/raw.js';
export { SerialNumber } from './components/serial-number.js';

export {
  getFontDefinition,
  listFontNames,
  type FontDefinition,
  type FontSpacing,
  type FontSize,
} from './fonts/b64-fonts.js';

import { Text } from './components/text.js';
import { Box } from './components/box.js';
import { Line } from './components/line.js';
import { Circle } from './components/circle.js';
import { Graphic } from './components/graphic.js';
import { Grid } from './components/grid.js';
import { Barcode } from './components/barcode.js';
import { Raw } from './components/raw.js';
import { SerialNumber } from './components/serial-number.js';

export const elements = {
  Text,
  Box,
  Line,
  Circle,
  Graphic,
  Grid,
  Barcode,
  Raw,
  SerialNumber,
} as const;

import { getFontDefinition, listFontNames } from './fonts/b64-fonts.js';
import type { FontFamilyValue } from './enums/font-family-name.js';

export const FontFamilyDefinition = {
  initialize(): void {
    for (const name of listFontNames()) {
      getFontDefinition(name as FontFamilyValue);
    }
  },
  get(name: FontFamilyValue) {
    return getFontDefinition(name);
  },
};
