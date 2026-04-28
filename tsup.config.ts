import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  target: 'es2022',
  outDir: 'dist',
  dts: false,
  sourcemap: true,
  clean: true,
  splitting: false,
  treeshake: true,
  minify: false,
});
