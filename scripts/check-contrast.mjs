#!/usr/bin/env node
/**
 * Contrast audit for the design tokens in src/styles/global.css.
 *
 * Reads the `:root` custom properties, then checks every foreground /
 * background pair the site actually uses against WCAG 2.1:
 *   AA normal text      4.5:1
 *   AA large text / UI  3.0:1
 *
 *   node scripts/check-contrast.mjs
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const cssPath = path.resolve(import.meta.dirname, '../src/styles/global.css');
const css = await readFile(cssPath, 'utf8');

const tokens = {};
for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:\s*(#[0-9a-f]{3,8})\s*;/gi)) {
  tokens[match[1]] = match[2];
}
tokens['--error-text'] = '#a4231c';
tokens['--status-upcoming-fg'] = '#14532d';
tokens['--status-upcoming-bg'] = '#eaf7ee';
tokens['--status-undated-fg'] = '#6b4a00';
tokens['--status-undated-bg'] = '#fdf5e4';
tokens['--deep-heading'] = '#ffffff';
tokens['--deep-footer-muted'] = '#8f9ac0';
tokens['--deep-eyebrow'] = '#8fb6ef';
tokens['--deep-link'] = '#a8c6f5';
tokens['--white'] = '#ffffff';
tokens['--initials-fg'] = tokens['--blue-700'];
tokens['--initials-bg'] = tokens['--blue-050'];

function hexToRgb(hex) {
  let value = hex.replace('#', '');
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  const int = parseInt(value.slice(0, 6), 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => {
    const s = channel / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** [foreground, background, minimum ratio, what it is used for] */
const pairs = [
  ['--ink', '--paper', 4.5, 'body text on white'],
  ['--ink', '--paper-2', 4.5, 'body text on tinted sections'],
  ['--ink-2', '--paper', 4.5, 'secondary text'],
  ['--ink-2', '--paper-2', 4.5, 'secondary text on tint'],
  ['--ink-3', '--paper', 4.5, 'captions and metadata'],
  ['--ink-3', '--paper-2', 4.5, 'captions on tint'],
  ['--blue', '--paper', 3, 'brand rules and dots'],
  ['--blue-700', '--paper', 4.5, 'links and eyebrows'],
  ['--blue-700', '--blue-050', 4.5, 'links on pale blue'],
  ['--blue-700', '--blue-100', 4.5, 'planned status text'],
  ['--white', '--blue', 4.5, 'primary button label'],
  ['--white', '--blue-700', 4.5, 'primary button hover'],
  ['--red', '--paper', 3, 'accent rule and markers'],
  ['--error-text', '--paper', 4.5, 'form error messages'],
  ['--error-text', '--red-050', 4.5, 'form error messages on error field'],
  ['--on-deep', '--deep', 4.5, 'text on the dark band'],
  ['--on-deep-2', '--deep', 4.5, 'secondary text on the dark band'],
  ['--deep-heading', '--deep', 4.5, 'headings on the dark band'],
  ['--deep-footer-muted', '--deep', 4.5, 'footer column headings'],
  ['--deep-eyebrow', '--deep', 4.5, 'eyebrow on the dark band'],
  ['--deep-link', '--deep', 4.5, 'links on the dark band'],
  ['--status-upcoming-fg', '--status-upcoming-bg', 4.5, '“upcoming” status chip'],
  ['--status-undated-fg', '--status-undated-bg', 4.5, '“date not published” chip'],
  ['--initials-fg', '--initials-bg', 4.5, 'leadership initials'],
  ['--focus', '--paper', 3, 'focus ring on light backgrounds'],
  ['--focus-on-deep', '--deep', 3, 'focus ring on the dark band'],
];

let failed = 0;
const rows = [];

for (const [fg, bg, minimum, usage] of pairs) {
  const fgHex = tokens[fg];
  const bgHex = tokens[bg];
  if (!fgHex || !bgHex) {
    console.error(`  ✗ unknown token in pair: ${fg} / ${bg}`);
    failed++;
    continue;
  }
  const ratio = contrast(fgHex, bgHex);
  const ok = ratio >= minimum;
  if (!ok) failed++;
  rows.push({ ok, fg, bg, ratio, minimum, usage });
}

const width = Math.max(...rows.map((r) => r.fg.length));
for (const row of rows) {
  const mark = row.ok ? '✓' : '✗';
  const ratio = row.ratio.toFixed(2).padStart(5);
  console.log(
    `${mark} ${ratio}:1  (min ${row.minimum})  ${row.fg.padEnd(width)} on ${row.bg.padEnd(16)}  ${row.usage}`,
  );
}

console.log(
  `\n${rows.length} pairs checked, ${rows.filter((r) => r.ok).length} pass, ${failed} fail.`,
);

process.exit(failed > 0 ? 1 : 0);
