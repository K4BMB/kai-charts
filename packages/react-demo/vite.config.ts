import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Path inside the library source, so dev server and build use `packages/react/src` directly. */
const lib = (file: string) => fileURLToPath(new URL(`../react/src/${file}`, import.meta.url));

// `base` is left to the CLI (`vite build --base=/kai-charts/react/` on GitHub Pages).
export default defineConfig({
  plugins: [react()],
  resolve: {
    // The demo consumes the library SOURCE: live reload without rebuilding the package.
    // `kai-charts-core` still resolves to its built `dist` through node_modules.
    alias: [
      { find: /^kai-charts-react\/styles\.css$/, replacement: lib('styles.css') },
      { find: /^kai-charts-react$/, replacement: lib('index.ts') },
    ],
    // One React instance even though the library source sits in another workspace package.
    dedupe: ['react', 'react-dom'],
  },
});
