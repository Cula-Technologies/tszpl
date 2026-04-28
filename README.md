# @cula-technologies/tszpl

![BADGE_NPM_VERSION](https://img.shields.io/npm/v/@cula-technologies/tszpl) ![BADGE_NPM_LICENCE](https://img.shields.io/npm/l/@cula-technologies/tszpl)

Generate ZPL II from TypeScript. Type-safe, async, zero runtime dependencies.

```ts
import { label, mm, DefaultLayoutEngine, createZplRenderer } from '@cula-technologies/tszpl';

const ir = label({ width: mm(100), height: mm(50), density: 8 })
  .text({ text: 'Hello World!', font: 'D', align: { h: 'center', v: 'center' } })
  .build();

const resolved = await new DefaultLayoutEngine().resolve(ir);
const zpl = await createZplRenderer().render(resolved);
console.log(zpl);
// ^XA
// ^FO0,191
// ^AD
// ^FB800,1000,0,C,0
// ^FDHello World!\&^FS
// ^XZ
```

> **Scope**: `tszpl` only **emits ZPL II source**. No client-side rasterizer, no canvas preview, no PNG/PDF output. To preview, send the ZPL to a Zebra printer or paste it into [Labelary](http://labelary.com/viewer.html).

## About

`tszpl` is a TypeScript ZPL II emitter built around a typed intermediate representation. Inspired by [JSZPL](https://github.com/DanieLeeuwner/JSZPL) — `1.0.0` is rewritten from scratch against the public [Zebra ZPL II Programming Manual](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf):

- Discriminated-union IR (`LabelNode | TextNode | …`) — exhaustive type checking.
- Pluggable renderer registry — one `NodeRenderer<K, T>` per kind; swap output target.
- Async layout pass with optional `TextMeasurer` for `Size.auto` rows + `UnicodeText.autoBreak`.
- ESM-first, zero runtime dependencies, strict TypeScript (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`).

**WARNING**: This is not a complete implementation of ZPL II. For unsupported commands, use the [`raw`](#raw) node.

## Install

```sh
npm  install @cula-technologies/tszpl
pnpm add     @cula-technologies/tszpl
yarn add     @cula-technologies/tszpl
bun  add     @cula-technologies/tszpl
```

Requires Node.js ≥ 18 or any modern bundler/browser environment.

## Pipeline

```
fluent builder  →  IR  →  layout  →  ResolvedNode  →  renderer  →  ZPL string
```

Three stages, three composable interfaces:

| Stage  | Type                    | Default impl                |
| ------ | ----------------------- | --------------------------- |
| Build  | `LabelBuilder` (fluent) | `label({...})`              |
| Layout | `LayoutEngine`          | `DefaultLayoutEngine`       |
| Render | `Renderer<string>`      | `ZplRenderer` (via factory) |

## Builder

`label(opts)` returns a fluent builder. Container nodes (`box`, `circle`, `grid`) take a callback to build children.

```ts
import { label, mm, abs, rel, spacing } from '@cula-technologies/tszpl';

const ir = label({ width: mm(100), height: mm(50), density: 8, padding: spacing(10) })
  .text({ text: 'Title', font: 'D', align: { h: 'center' } })
  .grid(
    {
      columns: [rel(1), rel(1)],
      rows: [abs(40), rel(1)],
      border: 2,
      padding: spacing(4),
    },
    (cell) =>
      cell
        .text({ text: 'A1', font: 'A', grid: { row: 0, column: 0 } })
        .text({ text: 'B1', font: 'A', grid: { row: 0, column: 1 } })
        .barcode({
          data: '5901234123457',
          type: 'EAN13',
          height: 50,
          grid: { row: 1, column: 0 },
        })
        .raw({ data: '^FO0,0^GB10,10,1^FS' }),
  )
  .build();
```

Every builder method maps 1:1 to an IR kind. Same props the underlying node accepts.

## IR reference

Every node is `{ kind: string; props: <KindProps> }`. Discriminated union — TypeScript narrows on `node.kind`.

| Kind          | Container | Purpose                                                        | Key props                                                                         |
| ------------- | --------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `label`       | yes       | Root: width/height in mm, density, optional `^CI28`            | `width`, `height`, `density`, `padding`, `useUnicode`, `children`                 |
| `text`        | no        | Built-in fonts A–F                                             | `text`, `font`, `align`, `characterWidth/Height`, `lineSpacing`, `autoBreak`      |
| `box`         | yes       | Rectangle, optional border, fill, rounded corners              | `width`, `height`, `border`, `fill`, `cornerRadius`, `padding`, `children`        |
| `line`        | no        | Diagonal line via `^GD`                                        | `x1`, `y1`, `x2`, `y2`, `thickness`                                               |
| `circle`      | yes       | Circle (`^GC`) or ellipse (`^GE`)                              | `width`, `height`, `border`, `fill`, `padding`, `children`                        |
| `grid`        | yes       | Column/row distribution; absolute / fraction / relative / auto | `columns`, `rows`, `columnSpacing`, `rowSpacing`, `border`, `padding`, `children` |
| `barcode`     | no        | 19 barcode types (Code 39/93/128, EAN, UPC, QR, …)             | `data`, `type`, `width`, `height`, `subset`, `interpretationLine`                 |
| `graphic`     | no        | Bitmap via `^GFA` (packed-bit hex per Zebra spec)              | `data: { width, height, bits }`                                                   |
| `unicodeText` | no        | Custom printer-resident TTF via `^A@` + `^FH` UTF-8            | `text`, `printerFontName`, `fontUrl`, `characterHeight`, `autoBreak`              |
| `serial`      | no        | Auto-incrementing serial via `^SN`                             | `format`, `font`, `increment`, `printLeadingZeroes`                               |
| `raw`         | no        | Pass-through ZPL                                               | `data`                                                                            |

### Sizes

```ts
import { abs, frac, rel, auto, type Size } from '@cula-technologies/tszpl';

abs(150); // exact dots
frac(0.5); // 50 % of parent
rel(2); // share of remainder; 2 means twice the share of `rel(1)` siblings
auto(); // measure UnicodeText (Grid rows only; requires TextMeasurer)
```

Bare numbers are interpreted as `abs(n)`.

### Spacing

```ts
import { spacing } from '@cula-technologies/tszpl';

spacing(10); // all sides 10
spacing(10, 20); // 10 horizontal, 20 vertical
spacing(10, 20, 30, 40); // left, top, right, bottom
```

`padding` and `margin` accept either a `Spacing` object or a bare `number` (shorthand for all sides equal):

```ts
label({ width: mm(100), height: mm(50), density: 8, padding: 12 }); // = spacing(12)
```

### Validation

```ts
import { validate, IRValidationError } from '@cula-technologies/tszpl';

try {
  validate(ir);
} catch (e) {
  if (e instanceof IRValidationError) console.error(e.path, e.message);
}
```

## Render pipeline

```ts
import { DefaultLayoutEngine, createZplRenderer } from '@cula-technologies/tszpl';

const layout = new DefaultLayoutEngine();
const renderer = createZplRenderer();

const resolved = await layout.resolve(ir);
const zpl: string = await renderer.render(resolved);
```

### Custom emitters

Replace any kind's emitter to customize output. Or register an emitter for a new kind via module augmentation.

```ts
import { ZplRenderer, type NodeRenderer } from '@cula-technologies/tszpl';

const verboseLabel: NodeRenderer<'label', string> = {
  kind: 'label',
  async emit(node, ctx) {
    let zpl = '^XA\n^LH0,0\n';
    for (const child of node.children) zpl += await ctx.emit(child);
    return zpl + '^XZ';
  },
};

const renderer = new ZplRenderer().use(verboseLabel); /* .use(...) per kind */
```

### Non-ZPL renderers

`Renderer<T>` is generic over output. Build a JSON renderer or a different printer language by implementing `NodeRenderer<K, T>` per kind.

```ts
import type { Renderer, NodeRenderer } from '@cula-technologies/tszpl';

const jsonText: NodeRenderer<'text', object> = {
  kind: 'text',
  emit(node) {
    return { kind: 'text', text: node.source.props.text, box: node.box };
  },
};
```

## Word wrap

`Text` (built-in fonts A–F) supports `autoBreak` directly — wraps at word boundaries using the spec font cell width. No measurer needed:

```ts
label({ width: mm(50), height: mm(30), density: 8 }).text({
  text: 'A long string that should wrap automatically',
  font: 'A',
  width: 200,
  autoBreak: true,
});
```

`UnicodeText.autoBreak` and `Grid` `Size.auto` rows containing `unicodeText` need a `TextMeasurer` (TTF metrics). `Grid` `Size.auto` rows with only built-in `text` work without a measurer.

## TextMeasurer (optional)

Provide a `TextMeasurer` via `LayoutCtx.measure` for `UnicodeText.autoBreak` or `Grid` auto rows containing `unicodeText`.

### Browser

```ts
import { CanvasTextMeasurer } from '@cula-technologies/tszpl';

const resolved = await layout.resolve(ir, {
  measure: new CanvasTextMeasurer(), // requires document + FontFace
});
```

### Custom

Implement the interface — works in any environment.

```ts
import type { TextMeasurer, MeasureRequest, MeasureResult } from '@cula-technologies/tszpl';

class MyMeasurer implements TextMeasurer {
  async measure(req: MeasureRequest): Promise<MeasureResult> {
    // word-aware wrap; return wrappedLines + total width/height
    return { width: 0, height: 0, wrappedLines: [req.text] };
  }
}
```

## Async API

Every render path is `Promise`-returning. Sync call sites must `await` — there is no synchronous escape hatch.

```ts
const zpl = await renderer.render(await layout.resolve(ir, ctx));
```

## Bundle formats

| File                         | Format | When it's used                                        |
| ---------------------------- | ------ | ----------------------------------------------------- |
| `dist/index.js`              | ESM    | `import` in Node.js / bundlers (via `exports.import`) |
| `dist/index.cjs`             | CJS    | `require()` in Node.js (via `exports.require`)        |
| `dist/index.d.ts` / `.d.cts` | Types  | TypeScript auto-resolves from `types`                 |

Source maps published alongside every bundle.

## Contributing

```sh
pnpm install
pnpm typecheck
pnpm lint
pnpm format
pnpm test
pnpm build
```

Strict TypeScript (`strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `verbatimModuleSyntax`). Typed linting via `typescript-eslint`. Prettier formatting.

## Known gaps

| Feature                 | Notes                                                                    |
| ----------------------- | ------------------------------------------------------------------------ |
| Rotation                | Not yet emitted                                                          |
| Grid columnspan/rowspan | Not yet supported                                                        |
| Built-in fonts G–V      | Only A–F default metrics; use `characterHeight`/`width` overrides        |
| Compressed `^GFA`       | Emitter writes uncompressed hex; fine for typical labels                 |
| `Raw`                   | Escape hatch for unsupported ZPL — no validation, write spec-correct ZPL |

## License & Credits

Licensed under the **MIT License**. See [LICENSE](./LICENSE).

### Origins and rewrite

`tszpl` was originally inspired by [JSZPL](https://github.com/DanieLeeuwner/JSZPL) by [Daniel Leeuwner](https://github.com/DanieLeeuwner) — credit for the original idea of a declarative ZPL II model goes there.

As of `1.0.0`, the entire library is an independent reimplementation derived from the public [Zebra ZPL II Programming Manual](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf):

- New typed IR (discriminated union per node kind), generic renderer registry, async layout pipeline.
- ZPL emitters derived from the public Zebra spec, not from JSZPL source.
- No bundled glyph tables (preview rasterizer removed; font metrics for `^A` are spec defaults).
- No surviving JSZPL files. License switched from GPL-3.0 to MIT.

If you used the early GPL-3.0 betas (`< 1.0.0`), upgrade to `1.0.0` for MIT.
