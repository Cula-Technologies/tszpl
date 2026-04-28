import { AlignmentValue } from '../enums/alignment-value';
import { Alignment } from '../properties/alignment';
import { BaseVisualComponent } from './base-visual-component';

export interface UnicodeTextProps {
  /** The text to render. */
  text: string;
  /** Name of the printer font to use for rendering the text. */
  printerFontName: string;
  /** URL of the font file to use for rendering the text. can also be base64 encoded file content. */
  fontUrl: string;
}

const INTERNAL_FONT_NAME = 'TTFFONT';

/**
 * Represents a Unicode text component as an extension for jszpl library.
 * This is needed to be able to custom unicode-ttf-fonts.
 */
export class UnicodeText extends BaseVisualComponent {
  override typeName = 'UnicodeText';
  private readonly fontDrive = 'E:';

  private printerFontName: string = 'TT0003M_.TTF';
  private fontUrl: string | undefined;
  public text: string = '';
  public lineSpacing: number = 0;
  public characterHeight: number = 22;
  public characterWidth: number = 0;

  public verticalAlignment = new Alignment(AlignmentValue.Start);
  public horizontalAlignment = new Alignment(AlignmentValue.Start);
  public autoBreak: boolean = false;

  constructor(properties: UnicodeTextProps) {
    super();
    this.text = properties.text;
    this.printerFontName = properties.printerFontName;
    this.fontUrl = properties.fontUrl;
  }

  getTextLines() {
    const expression = new RegExp('\\\\r\\\\n|\\\\n', 'g');
    return this.text.replace(expression, '\n').split('\n');
  }

  async ensureFontLoadedAtDocumentLevel() {
    // Load font before measuring/drawing so the saved image uses the intended face.
    const font = new FontFace(INTERNAL_FONT_NAME, `url(${this.fontUrl})`);
    await font.load();
    (document.fonts as unknown as { add: (font: FontFace) => void }).add(font);
  }

  async autoBreakText(availableWidth: number): Promise<void> {
    if (!this.fontUrl) throw new Error('fontUrl is not defined');

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    await this.ensureFontLoadedAtDocumentLevel();

    ctx.font = `${this.characterHeight}px "${INTERNAL_FONT_NAME}"`;

    const wrapped: string[] = [];
    for (const inputLine of this.getTextLines()) {
      wrapped.push(...this.wrapLine(ctx, inputLine, availableWidth));
    }
    this.text = wrapped.join('\n');
  }

  private wrapLine(ctx: CanvasRenderingContext2D, line: string, maxWidth: number): string[] {
    if (line === '' || ctx.measureText(line).width <= maxWidth) return [line];

    const words = line.split(' ');
    const out: string[] = [];
    let current = '';

    for (const word of words) {
      const candidate = current ? current + ' ' + word : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }

      if (current) out.push(current);

      if (ctx.measureText(word).width > maxWidth) {
        // Break oversized word by unicode codepoint.
        let buf = '';
        for (const ch of [...word]) {
          const cand = buf + ch;
          if (ctx.measureText(cand).width <= maxWidth) {
            buf = cand;
          } else {
            if (buf) out.push(buf);
            buf = ch;
          }
        }
        current = buf;
      } else {
        current = word;
      }
    }

    if (current) out.push(current);
    return out;
  }

  async calculateSize() {
    if (!this.fontUrl) throw new Error('fontUrl is not defined');

    // 1. Get your existing lines
    const lines: string[] = this.getTextLines();

    // 2. Setup Canvas for measurement
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Load font before measuring/drawing so the saved image uses the intended face.
    await this.ensureFontLoadedAtDocumentLevel();

    // Ensure this matches the @font-face name of your TTF
    ctx.font = `${this.characterHeight}px "${INTERNAL_FONT_NAME}"`;
    ctx.textBaseline = 'top';

    // 3. Find the widest line (Mandarin characters will be measured accurately here)
    let widestLine = 0;
    let y = 0;
    lines.forEach((line) => {
      const metrics = ctx.measureText(line);
      ctx.fillText(line, 0, y);
      if (metrics.width > widestLine) {
        widestLine = metrics.width;
      }
      y += this.characterHeight + this.lineSpacing;
    });

    // await this.downloadCanvas(canvas);

    // 4. Calculate total height
    // Formula: (Lines * Font Height) + (Gaps between lines)
    const totalHeight = lines.length * this.characterHeight + (lines.length - 1) * this.lineSpacing;

    return {
      width: Math.ceil(widestLine),
      height: Math.ceil(totalHeight),
    };
  }

  override async generateZPL(
    offsetLeft: number,
    offsetTop: number,
    availableWidth: number,
    availableHeight: number,
    widthUnits: number,
    heightUnits: number,
  ): Promise<string> {
    const position = this.getPosition(offsetLeft, offsetTop, availableWidth, availableHeight, widthUnits, heightUnits);

    if (this.autoBreak) {
      await this.autoBreakText(position.width);
    }

    const size = await this.calculateSize();

    if (this.verticalAlignment.value == AlignmentValue.End) {
      position.top = position.top + position.height - size.height;
    } else if (this.verticalAlignment.value == AlignmentValue.Center) {
      position.top = position.top + position.height / 2 - size.height / 2;
    }

    let zpl = '';

    if (this.invert) {
      zpl += '^LRY\n';
    }

    let horizontalAlignment;
    let lineSeparator = '';
    switch (this.horizontalAlignment.value) {
      case AlignmentValue.Start:
        horizontalAlignment = 'L';
        break;
      case AlignmentValue.Center:
        horizontalAlignment = 'C';
        lineSeparator = '\\&';
        break;
      case AlignmentValue.End:
        horizontalAlignment = 'R';
        break;
    }

    const lines = this.getTextLines();

    let textOffsetTop = 0;

    for (const line of lines) {
      zpl += '^FO' + Math.round(position.left) + ',' + Math.round(position.top + textOffsetTop);
      zpl +=
        '^A@N' +
        ',' +
        (this.characterHeight || '') +
        ',' +
        (this.characterWidth || '') +
        ',' +
        this.fontDrive +
        this.printerFontName +
        '\n';
      zpl += '^FB' + Math.round(position.width) + ',1000,0,' + horizontalAlignment + ',0\n';
      zpl += '^FH_^FD' + this.encodeZplHex(line) + lineSeparator + '^FS\n';

      textOffsetTop += this.characterHeight + this.lineSpacing;
    }

    if (this.invert) {
      zpl += '^LRN\n';
    }

    return zpl;
  }

  /**
   * Encodes a string for ZPL using the ^FH hex escape sequence.
   * Converts non-ASCII characters (like umlauts) to their UTF-8 hex equivalents (e.g., _C3_BC).
   * Also escapes the underscore character (_) to _5F to prevent parsing errors.
   * * @param text The standard string to encode
   * @returns The ZPL-safe hex-encoded string
   */
  encodeZplHex(text: string): string {
    // TextEncoder natively converts the string into a UTF-8 byte array
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);

    let result = '';

    for (const byte of bytes) {
      // Check if the byte is a standard printable ASCII character (32 to 126)
      // 95 is the underscore '_', which we MUST escape because it is the ZPL escape character
      if (byte >= 32 && byte <= 126 && byte !== 95) {
        result += String.fromCharCode(byte);
      } else {
        // Convert the byte to a 2-digit uppercase hex string and prepend the underscore
        const hex = byte.toString(16).toUpperCase().padStart(2, '0');
        result += `_${hex}`;
      }
    }

    return result;
  }
}
