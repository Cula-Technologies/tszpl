import { BaseContainerComponent } from './base-container-component.js';

export abstract class BaseGraphicComponent extends BaseContainerComponent {
  override border = 0;
  fill = false;
}
