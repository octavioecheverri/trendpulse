#!/usr/bin/env tsx
/**
 * CI gate: verify every locale in messages/ has the same set of keys as en.json.
 * Used in GitHub Actions before build to catch missing translations early.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';

const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');
const SOURCE = 'en';

type JsonObject = { [key: string]: unknown };

function collectKeys(obj: unknown, prefix = ''): string[] {
  if (obj === null || typeof obj !== 'object') return [prefix];
  if (Array.isArray(obj)) return obj.flatMap((v, i) => collectKeys(v, `${prefix}[${i}]`));
  return Object.entries(obj as JsonObject).flatMap(([k, v]) =>
    collectKeys(v, prefix ? `${prefix}.${k}` : k)
  );
}

async function main() {
  const sourceJson = JSON.parse(
    await fs.readFile(path.join(MESSAGES_DIR, `${SOURCE}.json`), 'utf8')
  );
  const sourceKeys = new Set(collectKeys(sourceJson));

  const files = await fs.readdir(MESSAGES_DIR);
  const otherLocales = files
    .filter((f) => f.endsWith('.json') && f !== `${SOURCE}.json`)
    .map((f) => f.replace('.json', ''));

  let hasError = false;
  for (const locale of otherLocales) {
    const json = JSON.parse(
      await fs.readFile(path.join(MESSAGES_DIR, `${locale}.json`), 'utf8')
    );
    const localeKeys = new Set(collectKeys(json));
    const missing = [...sourceKeys].filter((k) => !localeKeys.has(k));
    const extra = [...localeKeys].filter((k) => !sourceKeys.has(k));

    if (missing.length || extra.length) {
      hasError = true;
      console.error(`✗ ${locale}.json out of sync with ${SOURCE}.json`);
      if (missing.length) console.error(`  Missing keys (${missing.length}):`, missing.slice(0, 5));
      if (extra.length) console.error(`  Extra keys (${extra.length}):`, extra.slice(0, 5));
    } else {
      console.log(`✓ ${locale}.json (${localeKeys.size} keys)`);
    }
  }

  if (hasError) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
