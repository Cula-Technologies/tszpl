# Changelog

## 1.0.0

**Full rewrite from spec. License switch GPL-3.0 → MIT.**

The library is an independent reimplementation, written from scratch against the public [Zebra ZPL II Programming Manual](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf). No code from the original JSZPL project (GPL-3.0) survives. License accordingly relicensed to MIT.

### Architecture

- **Typed IR**: discriminated union (`LabelNode | TextNode | BoxNode | ...`) replaces the class-based component tree. Exhaustive `switch (node.kind)` checking via TypeScript.
- **Pluggable renderer registry**: `Renderer<TOut>` + `NodeRenderer<K, TOut>` per kind. Default `ZplRenderer` registers ZPL emitters via `createZplRenderer()`. Custom emitters (or non-ZPL output targets) are first-class.
- **Async layout pipeline**: `LayoutEngine.resolve(ir, ctx)` returns a `ResolvedNode` tree (boxes in dots). Optional `TextMeasurer` plugged through `LayoutCtx.measure` for `Size.auto` and `UnicodeText.autoBreak`.
- **Fluent builder**: `label({...}).text({...}).box({...}, b => b.text({...})).build()`. Container methods accept callbacks for nested children.
- **Spec-derived font metrics**: only A–F default cell sizes are bundled. No glyph data.
- **Spec-derived `^GFA` encoder**: bit-packed MSB-first hex, row-padded, uncompressed.
- **Spec-derived `^FH` UTF-8 encoder**: `_XX` escape per byte for `UnicodeText`.

### Public API (1.0.0)

- `label(opts)` → `LabelBuilder`
- `DefaultLayoutEngine`
- `ZplRenderer`, `createZplRenderer()`
- `validate(ir)`, `IRValidationError`
- `CanvasTextMeasurer` (browser-only, optional)
- IR types: `LabelNode`, `TextNode`, `BoxNode`, `LineNode`, `CircleNode`, `GridNode`, `BarcodeNode`, `GraphicNode`, `UnicodeTextNode`, `SerialNode`, `RawNode`
- Size helpers: `abs`, `frac`, `rel`, `auto`, `spacing`
- Unit helpers: `mm`, `dot`, `mmToDots`

### Removed (vs. pre-1.0 betas)

- All class-based components (`Label`, `Text`, `Box`, …).
- `generateBinaryImage()` and the entire client-side preview rasterizer.
- `BarcodeRenderer`, `ImageProcessor`, `ImageResizer`, `LabelTools`.
- Bundled glyph tables (`src/fonts/`).
- `Raw.generateXML()` legacy stub.
- UMD bundle and CDN distribution.
- Internal Google Artifact Registry publish target.
- `pngjs`, `lodash`, `rollup` devDependencies.

### Migration from `0.0.x`

`0.0.x` was a transitional class-based GPL-3.0 release. There is no compatibility shim — rewrite call sites against the fluent builder. See [README](./README.md#builder) for the new API.
