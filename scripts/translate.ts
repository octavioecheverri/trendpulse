#!/usr/bin/env tsx
/**
 * DeepL auto-translate script for TrendPulse messages.
 *
 * Usage:
 *   pnpm translate --locale=da
 *   pnpm translate --all                 # re-translate every non-source locale
 *   pnpm translate --locale=da --force   # overwrite existing values
 *
 * Reads messages/en.json (source of truth), recursively walks the JSON,
 * sends strings to DeepL, and writes messages/<locale>.json. Preserves
 * ICU plural syntax (e.g. {count, plural, one {...} other {...}}) by
 * using DeepL's `tag_handling=html` mode with placeholder tags.
 */

import * as deepl from 'deepl-node';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

const SOURCE_LOCALE = 'en';
const MESSAGES_DIR = path.resolve(process.cwd(), 'messages');

// DeepL target language codes (they differ slightly from our locale codes)
const LOCALE_TO_DEEPL: Record<string, deepl.TargetLanguageCode> = {
  es: 'es',
  fr: 'fr',
  ja: 'ja',
  ko: 'ko',
  pt: 'pt-PT',
  da: 'da',
  de: 'de',
  it: 'it',
  nl: 'nl',
  pl: 'pl',
  sv: 'sv',
  zh: 'zh',
};

type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
type JsonArray = JsonValue[];
type JsonObject = { [key: string]: JsonValue };

function isPlainObject(v: unknown): v is JsonObject {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/**
 * Walks the JSON and collects every string value with its path, so we can
 * batch-translate and reassemble afterwards.
 */
function collectStrings(obj: JsonValue, prefix = ''): Array<{ path: string; value: string }> {
  const out: Array<{ path: string; value: string }> = [];
  if (typeof obj === 'string') {
    out.push({ path: prefix, value: obj });
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => out.push(...collectStrings(item, `${prefix}[${i}]`)));
  } else if (isPlainObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      out.push(...collectStrings(v, prefix ? `${prefix}.${k}` : k));
    }
  }
  return out;
}

function setByPath(obj: JsonObject, path: string, value: string) {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cursor: JsonObject | JsonArray = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    if (Array.isArray(cursor)) {
      cursor = cursor[Number(key)] as JsonObject | JsonArray;
    } else {
      cursor = cursor[key] as JsonObject | JsonArray;
    }
  }
  const lastKey = parts[parts.length - 1];
  if (Array.isArray(cursor)) {
    cursor[Number(lastKey)] = value;
  } else {
    cursor[lastKey] = value;
  }
}

/**
 * Wrap ICU placeholder syntax in HTML-like tags so DeepL preserves them.
 * Example: "Hello {name}" → "Hello <x>{name}</x>"
 */
function protectPlaceholders(text: string): string {
  // Preserve entire ICU blocks by wrapping curly-brace expressions
  return text.replace(/(\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\})/g, '<x>$1</x>');
}

function restorePlaceholders(text: string): string {
  return text.replace(/<x>([^<]*)<\/x>/g, '$1');
}

async function main() {
  const { values } = parseArgs({
    options: {
      locale: { type: 'string' },
      all: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
    },
  });

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.error('DEEPL_API_KEY is not set. Add it to .env.local or environment.');
    process.exit(1);
  }

  const sourcePath = path.join(MESSAGES_DIR, `${SOURCE_LOCALE}.json`);
  const sourceJson: JsonObject = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
  const sourceStrings = collectStrings(sourceJson);

  let targetLocales: string[];
  if (values.all) {
    const files = await fs.readdir(MESSAGES_DIR);
    targetLocales = files
      .filter((f) => f.endsWith('.json') && f !== `${SOURCE_LOCALE}.json`)
      .map((f) => f.replace('.json', ''));
  } else if (values.locale) {
    targetLocales = [values.locale];
  } else {
    console.error('Usage: pnpm translate --locale=<code> | --all');
    process.exit(1);
  }

  const translator = new deepl.Translator(apiKey);

  for (const locale of targetLocales) {
    const deeplCode = LOCALE_TO_DEEPL[locale];
    if (!deeplCode) {
      console.warn(`⚠ Skipping ${locale} — no DeepL mapping. Add it to LOCALE_TO_DEEPL.`);
      continue;
    }

    const targetPath = path.join(MESSAGES_DIR, `${locale}.json`);
    let existing: JsonObject = {};
    try {
      existing = JSON.parse(await fs.readFile(targetPath, 'utf8'));
    } catch {
      // file doesn't exist yet
    }

    console.log(`→ Translating to ${locale} (DeepL code: ${deeplCode})…`);
    const toTranslate = sourceStrings.filter(({ path: p, value }) => {
      if (values.force) return true;
      const existingVal = getByPath(existing, p);
      return existingVal === undefined || existingVal === value;
    });

    if (toTranslate.length === 0) {
      console.log(`  Nothing to translate for ${locale} (use --force to overwrite).`);
      continue;
    }

    const texts = toTranslate.map(({ value }) => protectPlaceholders(value));
    const results = await translator.translateText(texts, 'en', deeplCode, {
      tagHandling: 'xml',
      ignoreTags: ['x'],
      preserveFormatting: true,
    });

    // Start from a deep clone of source to preserve structure, then overlay
    const translated: JsonObject = JSON.parse(JSON.stringify(sourceJson));
    // Copy existing values first (to preserve manually edited keys when not forcing)
    sourceStrings.forEach(({ path: p }) => {
      const existingVal = getByPath(existing, p);
      if (existingVal !== undefined && !values.force) {
        setByPath(translated, p, existingVal as string);
      }
    });
    // Apply fresh translations
    toTranslate.forEach(({ path: p }, i) => {
      const result = Array.isArray(results) ? results[i] : results;
      setByPath(translated, p, restorePlaceholders(result.text));
    });

    await fs.writeFile(targetPath, JSON.stringify(translated, null, 2) + '\n', 'utf8');
    console.log(`  ✓ Wrote ${toTranslate.length} translations to ${targetPath}`);
  }
}

function getByPath(obj: JsonObject, path: string): JsonValue | undefined {
  const parts = path.replace(/\[(\d+)\]/g, '.$1').split('.');
  let cursor: JsonValue = obj;
  for (const part of parts) {
    if (cursor == null) return undefined;
    if (Array.isArray(cursor)) {
      cursor = cursor[Number(part)];
    } else if (isPlainObject(cursor)) {
      cursor = cursor[part];
    } else {
      return undefined;
    }
  }
  return cursor;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
