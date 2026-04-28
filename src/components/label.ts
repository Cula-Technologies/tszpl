import { BaseContainerComponent } from './base-container-component.js';
import { PrintDensity } from '../properties/print-density.js';
import { PrintDensityName } from '../enums/print-density-name.js';
import type { BaseComponent } from './base-component.js';
import { UnicodeText } from './unicode-text.js';

export class Label extends BaseContainerComponent {
  override typeName = 'Label';

  printDensity: PrintDensity = new PrintDensity(PrintDensityName['8dpmm']);

  /**
   * Enables the UTF-8 international code page (`^CI28`) for this label.
   *
   * When enabled, `^CI28` is emitted at the start of the generated ZPL so that
   * non-ASCII characters (e.g. encoded with `^FH` hex escapes by `UnicodeText`)
   * are interpreted correctly by the printer.
   *
   * If left `false` (the default), the value is auto-detected: it becomes
   * effectively enabled when any `UnicodeText` component exists in the
   * label's descendant tree. Set it explicitly to `true` to force-enable
   * even when no `UnicodeText` is present (e.g. when adding raw ZPL that
   * relies on UTF-8).
   */
  useUnicode: boolean = false;

  override async generateZPL(): Promise<string> {
    let zpl = '^XA\n';

    if (this.useUnicode || this.containsUnicodeText()) {
      zpl += '^CI28\n';
    }

    const width = this.getSize(this.width) * this.printDensity.value;
    const height = this.getSize(this.height) * this.printDensity.value;

    zpl += await super.generateZPL(0, 0, width, height);

    zpl += '^XZ';

    return zpl;
  }

  private containsUnicodeText(): boolean {
    return Label.treeContainsUnicodeText(this);
  }

  private static treeContainsUnicodeText(node: BaseComponent): boolean {
    if (node instanceof UnicodeText) return true;
    if (!('children' in node)) return false;
    const children = (node as { children?: readonly BaseComponent[] }).children;
    if (!children) return false;
    for (const child of children) {
      if (Label.treeContainsUnicodeText(child)) return true;
    }
    return false;
  }
}
