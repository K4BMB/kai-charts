// Copies the package metadata files that ng-packagr does not pick up from the workspace root.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dest = join('dist', 'kai-charts');
mkdirSync(dest, { recursive: true });
for (const file of ['README.md', 'LICENSE', 'CHANGELOG.md']) {
  if (!existsSync(file)) throw new Error(`Missing ${file} at the workspace root`);
  copyFileSync(file, join(dest, file));
}
console.log(`Copied README.md, LICENSE and CHANGELOG.md to ${dest}`);
