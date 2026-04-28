import { ZplRenderer } from './index.js';
import {
  labelEmitter,
  textEmitter,
  boxEmitter,
  rawEmitter,
  lineEmitter,
  circleEmitter,
  barcodeEmitter,
  serialEmitter,
  graphicEmitter,
  unicodeTextEmitter,
  gridEmitter,
} from './emitters.js';

export const createZplRenderer = (): ZplRenderer =>
  new ZplRenderer()
    .use(labelEmitter)
    .use(textEmitter)
    .use(boxEmitter)
    .use(rawEmitter)
    .use(lineEmitter)
    .use(circleEmitter)
    .use(barcodeEmitter)
    .use(serialEmitter)
    .use(graphicEmitter)
    .use(unicodeTextEmitter)
    .use(gridEmitter);
