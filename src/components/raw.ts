import { BaseComponent } from './base-component.js';

export class Raw extends BaseComponent {
  override typeName = 'Raw';

  data = '';

  override async generateZPL(): Promise<string> {
    if (!this.data || this.data === '') return '';
    return this.data + '\n';
  }
}
