import type { GraphicData } from '../properties/graphic-data.js';

export type ImageDataCallback = (data: readonly number[]) => void;

export class ImageProcessor {
  processor: unknown = undefined;

  processImage(_data: GraphicData, cb?: ImageDataCallback): void {
    if (cb) cb([]);
  }

  processZplImage(_width: number, _height: number, _data: readonly number[]): void {
    // override point
  }
}
