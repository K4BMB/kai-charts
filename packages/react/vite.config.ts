import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

/**
 * Library build: ESM only, React and kai-charts-core left external, `.d.ts` emitted per file,
 * and the component CSS (which only re-exports the kai-charts-core stylesheets) extracted to
 * `dist/kai-charts-react.css`, published as `kai-charts-react/styles.css`.
 */
export default defineConfig({
  plugins: [
    react(),
    dts({
      tsconfigPath: './tsconfig.build.json',
      exclude: ['src/**/*.spec.ts', 'src/**/*.spec.tsx', 'src/test-setup.ts'],
    }),
  ],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: () => 'index.js',
      cssFileName: 'kai-charts-react',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime', 'kai-charts-core'],
    },
  },
});
