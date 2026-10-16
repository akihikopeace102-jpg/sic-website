// @ts-check
import { defineConfig } from 'astro/config';

/**
 * Static-only site: no backend, no database, no client framework.
 * Every page is pre-rendered to HTML at build time.
 *
 * PUBLIC_SITE_URL is used for canonical URLs and social-sharing metadata.
 * Set it in `.env` before deploying. See `.env.example`.
 */
const site = process.env.PUBLIC_SITE_URL ?? 'https://example.invalid';

export default defineConfig({
  site,
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
