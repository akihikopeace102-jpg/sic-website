#!/usr/bin/env node
/**
 * Internal link checker.
 *
 * Runs against the built site in `dist/`: every local href/src in every HTML
 * file must resolve to a file that was actually built, and every `#fragment`
 * must find a matching id. `javascript:` URLs are always a failure.
 *
 *   node scripts/check-links.mjs              internal links only (offline)
 *   node scripts/check-links.mjs --external   also fetch every external URL
 *   node scripts/check-links.mjs --quiet      only print failures
 */
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync, statSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const external = process.argv.includes('--external');
const quiet = process.argv.includes('--quiet');

if (!existsSync(dist)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(full)));
    else if (entry.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = (await walk(dist)).sort();
const idsByFile = new Map();
const failures = [];
const externals = new Set();
const placeholders = new Set();

/** Has the build been given a real PUBLIC_SITE_URL yet? */
function isPlaceholder(url) {
  try {
    return new URL(url).hostname === 'example.invalid';
  } catch {
    return false;
  }
}
let checked = 0;

/** Every id available in a built HTML file. */
async function idsIn(file) {
  if (idsByFile.has(file)) return idsByFile.get(file);
  const html = await readFile(file, 'utf8');
  const ids = new Set();
  for (const match of html.matchAll(/\bid\s*=\s*["']([^"']+)["']/gi)) ids.add(match[1]);
  for (const match of html.matchAll(/<a[^>]*\bname\s*=\s*["']([^"']+)["']/gi)) ids.add(match[1]);
  idsByFile.set(file, ids);
  return ids;
}

/** Does this site-absolute path point at a file in dist/? */
function resolveLocal(fromFile, pathname) {
  const clean = decodeURI(pathname).split('?')[0].split('#')[0];
  let target = path.join(dist, clean.replace(/^\/+/, ''));

  if (existsSync(target) && statSync(target).isFile()) return target;
  if (clean.endsWith('/') || !path.extname(clean)) {
    const asIndex = path.join(target, 'index.html');
    if (existsSync(asIndex)) return asIndex;
    if (existsSync(`${target}.html`)) return `${target}.html`;
  }
  if (existsSync(`${target}.html`)) return `${target}.html`;
  return null;
}

for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(dist, file);

  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']*)["']/gi)) {
    const raw = match[1].trim();
    if (!raw || raw.startsWith('data:') || raw.startsWith('#!')) continue;
    checked++;

    if (raw.toLowerCase().startsWith('javascript:')) {
      failures.push(`${rel}: javascript: URL → ${raw}`);
      continue;
    }

    if (/^(mailto:|tel:|sms:)/i.test(raw)) continue;

    if (/^https?:\/\//i.test(raw)) {
      // Canonical/OG URLs are absolute and point at whatever PUBLIC_SITE_URL
      // was set to at build time. Until it is, they are placeholders.
      if (isPlaceholder(raw)) placeholders.add(raw.split('#')[0]);
      else externals.add(raw.split('#')[0]);
      continue;
    }

    if (raw.startsWith('//')) {
      failures.push(`${rel}: protocol-relative URL → ${raw}`);
      continue;
    }

    const [pathPart, fragment] = raw.split('#');

    // Same-page fragment.
    if (!pathPart) {
      if (fragment) {
        const ids = await idsIn(file);
        if (!ids.has(fragment)) failures.push(`${rel}: missing #${fragment} on this page`);
      }
      continue;
    }

    const target = resolveLocal(file, pathPart);
    if (!target) {
      failures.push(`${rel}: broken link → ${raw}`);
      continue;
    }

    if (fragment) {
      const ids = await idsIn(target);
      if (!ids.has(fragment)) {
        failures.push(
          `${rel}: ${raw} → ${path.relative(dist, target)} has no #${fragment}`,
        );
      }
    }
  }
}

async function checkExternal() {
  const results = [];
  const queue = [...externals];
  const limit = 6;

  async function worker() {
    while (queue.length > 0) {
      const url = queue.shift();
      try {
        const response = await fetch(url, {
          redirect: 'follow',
          signal: AbortSignal.timeout(20_000),
          headers: { 'user-agent': 'choithram-sic link check (+static site)' },
        });
        results.push({ url, status: response.status, ok: response.ok });
        await response.body?.cancel();
      } catch (error) {
        results.push({ url, status: 0, ok: false, error: String(error) });
      }
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results.sort((a, b) => a.url.localeCompare(b.url));
}

if (!quiet) {
  console.log(`Checked ${checked} link references across ${htmlFiles.length} pages.`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} internal link problem(s):`);
  for (const failure of failures) console.error(`  ✗ ${failure}`);
} else if (!quiet) {
  console.log('Internal links: all resolve.');
}

if (placeholders.size > 0) {
  console.log(
    `\n${placeholders.size} URL(s) point at https://example.invalid — a placeholder, ` +
      'not a real link. Set PUBLIC_SITE_URL in .env before deploying.',
  );
}

if (external) {
  const results = await checkExternal();
  const broken = results.filter((r) => !r.ok);
  console.log(`\nExternal URLs: ${results.length} checked, ${broken.length} failed.`);
  for (const item of broken) {
    console.error(`  ✗ ${item.status || 'ERR'} ${item.url}${item.error ? ` — ${item.error}` : ''}`);
  }
  if (broken.length === 0) {
    for (const item of results) console.log(`  ✓ ${item.status} ${item.url}`);
  }
  if (broken.length > 0) process.exitCode = 1;
}

if (failures.length > 0) process.exit(1);
