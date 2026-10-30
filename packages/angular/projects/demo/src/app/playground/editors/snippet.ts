/**
 * Helpers that turn the sandbox state into a copy-pasteable Angular snippet: the element with
 * only the non-default inputs plus the data constants as TypeScript literals.
 */

/** `'Zulia'`, `42`, `null`, `[1, 2]`, `{ a: 1 }` as TypeScript source (undefined/'' keys omitted). */
export function tsLiteral(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return `[${value.map(tsLiteral).join(', ')}]`;
  if (typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined && v !== '');
    if (entries.length === 0) return '{}';
    return `{ ${entries.map(([k, v]) => `${k}: ${tsLiteral(v)}`).join(', ')} }`;
  }
  return String(value);
}

/** `const rows: TableRow[] = [\n  { … },\n];` — one element per line. */
export function tsConst(name: string, type: string | null, items: readonly unknown[]): string {
  const head = type ? `const ${name}: ${type}[]` : `const ${name}`;
  if (items.length === 0) return `${head} = [];`;
  return `${head} = [\n${items.map((item) => `  ${tsLiteral(item)},`).join('\n')}\n];`;
}

/** `<kc-x\n  attr\n  attr\n/>` */
export function element(tag: string, attrs: readonly string[]): string {
  return `<${tag}\n  ${attrs.join('\n  ')}\n/>`;
}

/** `name="value"` with double quotes escaped. */
export function attr(name: string, value: string): string {
  return `${name}="${value.replace(/"/g, '&quot;')}"`;
}

/** `[name]="value"` for numbers, booleans and other expressions. */
export function bind(name: string, expression: string | number | boolean): string {
  return `[${name}]="${expression}"`;
}
