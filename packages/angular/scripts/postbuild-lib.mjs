// Completes the publishable package: metadata files from the monorepo root and the shared
// token stylesheet from kai-charts-core (ng-packagr only copies files inside the library root).
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = join('..', '..');
const dest = join('dist', 'kai-charts');
mkdirSync(join(dest, 'styles'), { recursive: true });
for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
  const source = join(root, file);
  if (!existsSync(source)) throw new Error(`Missing ${source}`);
  copyFileSync(source, join(dest, file));
}
const tokens = join(root, 'packages', 'core', 'styles', 'tokens.css');
copyFileSync(tokens, join(dest, 'styles', 'tokens.css'));
console.log(`Copied README.md, LICENSE, CHANGELOG.md and styles/tokens.css to ${dest}`);
