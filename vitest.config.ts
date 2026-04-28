import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.tsx', '.mts', '.js', '.jsx', '.mjs', '.json'],
  },
  test: {
    include: ['tests/**/*.test.{js,ts}'],
    globals: true,
    environment: 'node',
    alias: [{ find: /^(\.\.\/src\/.+)\.js$/, replacement: '$1.ts' }],
  },
});
