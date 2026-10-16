# School Innovation Council: Choithram School, Manik Bagh Road, Indore

The official website of the **School Innovation Council (SIC)** at Choithram
School, Manik Bagh Road, Indore. It covers the council only: what it is, what it
has planned month by month, what it has already run, who leads it and how to
reach it. All content is drawn from the council's own published material and the
national programme it belongs to.

Built with Astro 7 as static HTML. No backend, no database, no authentication,
no CMS, no analytics, no third-party requests.

> This is the council's own site, written in its own voice. It is not a
> reproduction or a digest of another website, so it does not carry visible
> attribution, captions naming image albums, or "as reported by" hedges on the
> pages themselves. Provenance is tracked in `src/content/` for the maintainers
> and documented in this README, not shown to the reader.

---

## Scope

**In scope**

- The School Innovation Council, its three working bodies (I-Cell, E-Cell,
  Good Earth), the Innovation Wall, the 2026-27 activity calendar, the council's
  committee, its published events and its contact details.
- The national programme the council belongs to: the Ministry of Education's
  Innovation Cell, the Scheme & Guidelines, and the National Policy for
  Promoting Innovations in Schools.

**Out of scope**

- The school's own philosophy, ethos, admissions, board affiliation and general
  academics. Those belong to the school. Where they are unavoidable, this site
  gives a one-line link to [choithramschool.com](https://choithramschool.com/)
  and stops.

---

## Quick start

Requires Node `>=22.22.0` (Astro 7's floor) and npm `>=9.6.5`.

```bash
npm install        # no preinstall/install/postinstall in any dependency; npm audit: 0 vulnerabilities
npm run dev        # http://localhost:4321
npm run verify     # check + build + contrast audit + link audit
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Static build into `dist/` |
| `npm run preview` | Serve the built site |
| `npm run check` / `npm run lint` | `astro check`: types and content-schema validation |
| `npm run contrast` | WCAG contrast audit of the design tokens in `src/styles/global.css` |
| `npm run links` | Internal link + fragment audit of `dist/` (offline) |
| `npm run links:external` | Same, plus a live fetch of every outbound URL |
| `npm run verify` | check → build → contrast → links |

Latest run: **0 errors, 0 warnings** (`astro check`), **25 pages built**,
**26/26 contrast pairs pass**, **776 internal link references all resolve**,
**7/7 external URLs return HTTP 200**.

---

## How it is put together

```
astro.config.mjs          static output, directory format, site from PUBLIC_SITE_URL
src/content.config.ts     zod schemas for the three collections (build fails on bad data)
src/content/sources/      one JSON per source: title, publisher, url, retrieved, note
src/content/events/       one Markdown per event: frontmatter + the long text
src/content/leadership/   session-2026-27.json: the committee exactly as published
src/data/site.ts          non-editorial constants: nav, contact block, site name
src/lib/events.ts         ordering, bucketing, source resolution, primary link
src/styles/global.css     the whole design system, tokens at the top
src/layouts/BaseLayout.astro
src/components/           SiteHeader, SiteFooter, EventCard, ArchiveList,
                          LeaderGroup, PictureFigure, EmptyState
src/pages/                /, /events/, /events/[slug]/, /about/, /mission/,
                          /leadership/, /contact/, /404
scripts/                  check-links.mjs, check-contrast.mjs
public/images/            school logo + 8 photographs from the council's own galleries
```

### The date model

This is the part the site is most careful about, because the sources are uneven.

Each event declares `precision`:

| `precision` | Meaning | What the reader sees |
| --- | --- | --- |
| `day` | The source publishes a calendar date. | `dateLabel`, e.g. “12 July 2025” |
| `month` | The source publishes a period only. `startDate` is an ordering anchor inside that period and is never displayed. | `dateLabel`, e.g. “Last week of July 2025” |
| `none` | No date was published. | No date is shown at all; `dateLabel` is omitted |

Planned entries (`status: planned`) come from the activity calendar, which names
months and nothing else, so they carry **no dates at all**, only `dateLabel`
(e.g. “October 2026”) and a `sortKey` for ordering. A schema rule fails the
build if a planned entry is given a date.

Nothing on this site displays a date that a source did not publish.

### Adding content

**A new planned month**: copy `src/content/events/2026-10-october.md`, keep
`status: planned`, `bucket: now`, `precision: month`, `startDate: null` (omit
it), set `dateLabel` and `sortKey`, and cite `sic-calendar-2026-27`.

**A dated event**: new Markdown file with `status: completed` or `upcoming`,
`precision: day`, `startDate`, `bucket: recent` or `archive`, and at least one
`sourceIds` entry. `astro check` rejects a `day` entry without a `startDate`,
an end date before a start date, a `javascript:` or `http://` link, or a
missing source.

**A new source**: add `src/content/sources/<id>.json`. Each entry cites its
sources by id, so a fact can always be traced back internally. Source ids are
used by `astro check` and the maintainers; they are not rendered on the site.

---

## Design decisions

**Palette from the logo, not from a picker.** The colours were sampled from the
school's own header artwork: blue `#004AAD`, red `#DA251C`, deep indigo
`#29166F` (darkened to `#0F1526` for large dark bands so text clears AA). The
result reads as the school's own identity rather than as a generic product
site.

**Editorial, not a landing page.** Serif display headings over a system sans
body; numbered index rows; a pull quote used once; full-bleed tinted and dark
bands alternating with white; generous whitespace; hairline rules instead of
card shadows everywhere. No hero-with-two-buttons-plus-screenshot formula, no
gradient blobs, no glassmorphism, no purple, no icon soup, no emoji.

**Zero font downloads.** Display serif is `Iowan Old Style / Charter / Palatino
/ Georgia`; body is the platform sans stack. Nothing third-party loads: no
Google Fonts, no CDN, no analytics, no embeds, no cookies.

**Photographs are the council's own**, from its galleries and page carousels,
kept in `public/images/`. They carry descriptive `alt` text for screen readers
and nothing else: no captions, no album names, no provenance on the page. The
originals were resized only.

**Accessibility**: semantic landmarks and a single `h1` per page, skip link,
visible focus rings (checked against both light and dark bands), `aria-current`
on navigation (including parent sections on nested pages), labelled form
fields, `aria-live` status for form validation, `prefers-reduced-motion`
respected, and colour contrast verified rather than eyeballed:

```
✓ 17.79:1  --ink on --paper            ✓ 16.53:1  --on-deep on --deep
✓  5.96:1  --ink-3 on --paper          ✓ 10.11:1  --on-deep-2 on --deep
✓  8.13:1  white on --blue             ✓ 10.77:1  white on --blue-700
   … 26 pairs checked, 26 pass, 0 fail (scripts/check-contrast.mjs)
```

**The contact form does not pretend.** The site is static and has nowhere to
send a message, so the composer validates what you type, then opens your own
mail client addressed to `sic@choithramschool.com` with the text filled in. The
page says this in plain words, nothing is stored, and a `<noscript>` block
gives the address and phone number for anyone without JavaScript.

---

## Sources

All read on **16 October 2026**. This table is the maintainers' record of where
the site's content comes from. It is deliberately **not** rendered on the site:
this is the council's own website, so its pages carry content, not citations.

| id | Source | Publisher | Read |
| --- | --- | --- | --- |
| `sic-home` | [School Innovation Council](https://choithramschool.com/sic/) | Choithram School, Manik Bagh Road, Indore | 2026-10-16 |
| `sic-about` | [About the School Innovation Council](https://choithramschool.com/sic/aboutus.php) | Choithram School | 2026-10-16 |
| `sic-council` | [Committee, Session 2026-27](https://choithramschool.com/sic/council.php) | Choithram School | 2026-10-16 |
| `sic-i-cell` | [I-Cell](https://choithramschool.com/sic/i-cell.php) | Choithram School | 2026-10-16 |
| `sic-e-cell` | [E-Cell](https://choithramschool.com/sic/e-cell.php) | Choithram School | 2026-10-16 |
| `sic-good-earth` | [Good Earth](https://choithramschool.com/sic/good-earth.php) | Choithram School | 2026-10-16 |
| `sic-gallery` | [Event & Gallery](https://choithramschool.com/sic/event.php) | Choithram School | 2026-10-16 |
| `sic-contact` | [Contact Us](https://choithramschool.com/sic/contact.php) | Choithram School | 2026-10-16 |
| `sic-calendar-2026-27` | [Activity Calendar 2026-27 (PDF)](https://choithramschool.com/sic/Activity_Calendar_CSMB_SIC_2026_27.pdf) | Choithram School | 2026-10-16 |
| `sic-innovation-wall` | [Innovation Wall](https://choithramschool.com/sic/InnovationWall/index.php) | Choithram School | 2026-10-16 |
| `innoverse-2026` | [Innoverse 2026](https://choithramschool.com/innoverse/) | One Choithram, Choithram School | 2026-10-16 |
| `mic-sic-guidelines` | [Scheme & Guidelines 2024-25 (PDF)](https://sicmicstadiag.blob.core.windows.net/sicwebsite/static/downloads/SIC-Guidelines-2024.pdf) | Ministry of Education's Innovation Cell | 2026-10-16 |
| `mic-sic-portal` | [SIC portal](https://sic.mic.gov.in/) | Ministry of Education's Innovation Cell | 2026-10-16 |
| `nppis` | [National Policy for Promoting Innovations in Schools (PDF)](https://sia.mic.gov.in/assets/doc/school-innovation-policy.pdf) | Department of School Education and Literacy | 2026-10-16 |

### Access limitations, recorded honestly

- `https://sic.mic.gov.in/` is a client-rendered application. Only document
  metadata could be read (title “School Innovation Council”, author
  `mic.gov.in`). No claims on this site are based on its rendered content.
- `https://education.gov.in/en/school-innovation-council` returns a soft-404:
  the Next.js payload contains an empty `pageProps`. It is **not** cited.
- The Ministry of Education homepage and its WordPress REST API were not
  readable either (404 shell), so `mic.gov.in`'s homepage is not cited.
- The guidelines PDF is a blob-storage URL. If it moves, `npm run links:external`
  will report it.
- The e-mail address `sic@choithramschool.com` was decoded from the Cloudflare
  e-mail-obfuscation attribute on the council's contact page and cross-checked
  against the same attribute on the council's other pages.

---

## Decisions that could have gone the other way

These are deliberate, and each is defensible from the record:

1. **Named students.** The two award winners at the Maharaja Junior Scientist
   Competition (26 August 2025) are named, because the council publishes them as
   award recipients. The **thirteen** student speakers in the July 2025 ideation
   drive are counted but *not* named: listing pupils by name and grade adds
   nothing the reader needs.
2. **No photographs of office-holders.** The council publishes none, so the
   leadership page uses typographic initials instead of portraits.
3. **The school's pin code.** The council's contact page says **452009**; the
   main school site says **452014** for the same road. This site uses 452009
   throughout. The discrepancy is recorded here (and only here).
4. **Committee group letters.** The national guidelines define groups A–E. The
   council's published page labels its groups **A, B, D, E** and puts the Social
   Media Coordinator inside the teacher group, so there is no group C on its
   committee. The leadership page follows the school's own committee; `/about/`
   describes the five groups the programme defines.
5. **Innoverse's dates.** The event site and the council's announcement both say
   **28–30 September 2026**, so the event is listed as completed. The activity
   calendar also lists Innoverse under December; that contradiction is noted
   here rather than on the page.
6. **Undated entries stay undated.** Five council activities (the design
   thinking workshop, the start-up ecosystem session, the inaugural meet, the
   orphanage visit and Good Earth's first sale) have no published date. They are
   grouped under “Other activities”, ordered by title, and shown without a date.
7. **Month-only calendar rows** are shown as *plans*, and the events page says
   that dates, times and venues are announced closer to each month.

---

## Voice and punctuation

The site is written in the council's own voice: first-person institutional, no
hedges, no “according to”, no third-person references to “the council's report”.
Em dashes are avoided throughout. Every event page and list entry states facts
directly, and dates are only ever the ones the council has published.

---

## Known issues and things left open

- **`PUBLIC_SITE_URL` is unset**, so canonical and Open Graph URLs are the
  placeholder `https://example.invalid/…`. `npm run links:external` reports
  them. Set it in `.env` (see `.env.example`) before deploying.
- **No bespoke social card.** Open Graph tags are text only; there is no
  generated image. `twitter:card` is `summary`.
- **The calendar PDF has two blemishes** that were not corrected in the data:
  one row prints “Febuary”, and one row's month cell is empty (that row is
  omitted from the events, and the omission is worth noting if the calendar is
  re-read). The February row also prints “Tatva bodh-2026”.
- **The Innoverse site's own countdown** still points at a past date; only its
  published dates (28–30 September 2026) are used here.
- **No CMS.** Editing means editing Markdown/JSON and rebuilding. That is a
  deliberate trade: the content model is validated at build time instead.
- **No server-side form.** See “The contact form does not pretend” above.
- **Photographs are the school's own material.** They are used here from public
  pages of the council's site. Confirm permission with the school before
  publishing this site.
- **`education.gov.in`'s SIC page** is a soft-404 today (see above). If it is
  restored, it is the natural source for the programme's overview and should
  replace some of the paraphrase on `/about/`.

---

## Deploying

The build is a plain static directory:

```bash
echo 'PUBLIC_SITE_URL=https://example.org' > .env
npm run verify
```

`dist/` can go on any static host. The build uses `trailingSlash: 'always'` and
`build.format: 'directory'`, so keep the trailing slashes (the link checker
enforces them). `.env` is git-ignored; no secrets are needed for this site.
