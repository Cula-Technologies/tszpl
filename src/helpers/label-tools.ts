import { ImageProcessor } from './image-processor.js';
import { ImageResizer } from './image-resizer.js';

export const LabelTools = {
  ImageProcessor: new ImageProcessor(),
  ImageResizer: new ImageResizer(),
  Logger(msg: string): void {
    // eslint-disable-next-line no-console
    console.log(msg);
  },
};

export type LabelToolsType = typeof LabelTools;
