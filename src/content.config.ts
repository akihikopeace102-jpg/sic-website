import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

/**
 * Content collections.
 *
 * Everything a school administrator is expected to edit lives in
 * `src/content/` as JSON or Markdown with frontmatter. The schemas below
 * run at build time: an invalid or incomplete entry fails the build rather
 * than rendering a broken page.
 */

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected an ISO date in the form YYYY-MM-DD');

const linkTarget = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith('/') || value.startsWith('https://'),
    'Links must be a site-absolute path (/…) or an https:// URL',
  );

/* ------------------------------------------------------------------ sources */

const sources = defineCollection({
  loader: glob({ base: './src/content/sources', pattern: '**/*.json' }),
  schema: z.object({
    title: z.string().min(1),
    publisher: z.string().min(1),
    url: z
      .url()
      .refine((value) => value.startsWith('https://'), 'Sources must be published over https://'),
    retrieved: isoDate,
    note: z.string().optional(),
  }),
});

/* ------------------------------------------------------------------- events */

const events = defineCollection({
  loader: glob({ base: './src/content/events', pattern: '**/*.md' }),
  schema: z
    .object({
      title: z.string().min(3).max(110),

      status: z.enum(['planned', 'upcoming', 'ongoing', 'completed']),

      /** Which list on the events page this entry belongs to. */
      bucket: z.enum(['now', 'recent', 'archive', 'undated']),

      /**
       * How much of the date is actually published.
       *   day   - a calendar date was published.
       *   month - only the period was published. `startDate` is an ordering
       *           anchor inside that period; it is never displayed.
       *           `dateLabel` is what the reader sees.
       *   none  - no date was published at all.
       */
      precision: z.enum(['day', 'month', 'none']),

      /**
       * Text that is actually shown to the reader. Required whenever any date
       * was published; omitted when `precision` is "none".
       */
      dateLabel: z.string().min(1).optional(),

      startDate: isoDate.optional(),
      endDate: isoDate.optional(),

      /**
       * Optional ordering anchor. Falls back to `startDate`, then to title
       * order. Use it only to correct ordering within a published period
       * (for example "last week of July" after 19 July). Never displayed.
       */
      sortKey: isoDate.optional(),

      time: z.string().max(80).optional(),
      location: z.string().max(160).optional(),

      /** One-line summary used on cards and in lists. */
      summary: z.string().min(20).max(400),

      sourceIds: z.array(reference('sources')).min(1),

      links: z
        .array(
          z.object({
            label: z.string().min(1),
            href: linkTarget,
            kind: z.enum(['information', 'registration']),
          }),
        )
        .default([]),

      image: z
        .object({
          src: z.string().startsWith('/'),
          alt: z.string().min(10),
        })
        .optional(),
    })
    .superRefine((value, ctx) => {
      if (value.precision !== 'none' && !value.dateLabel) {
        ctx.addIssue({
          code: 'custom',
          path: ['dateLabel'],
          message: 'dateLabel is required unless precision is "none".',
        });
      }

      if (value.status === 'planned') {
        if (value.startDate || value.endDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['startDate'],
            message:
              'A planned entry must not carry a date: the activity calendar publishes months, not dates. Use dateLabel and sortKey instead.',
          });
        }
        if (value.precision !== 'month') {
          ctx.addIssue({
            code: 'custom',
            path: ['precision'],
            message: 'Planned entries must use precision: "month".',
          });
        }
      }

      if (value.precision === 'day' && !value.startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['startDate'],
          message: 'precision "day" requires startDate.',
        });
      }

      if (value.precision === 'none') {
        if (value.startDate || value.endDate) {
          ctx.addIssue({
            code: 'custom',
            path: ['startDate'],
            message: 'precision "none" must not carry a date.',
          });
        }
      }

      if (value.startDate && value.endDate && value.endDate < value.startDate) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: 'endDate must not be before startDate.',
        });
      }

      if (value.precision === 'month' && !value.startDate && value.status !== 'planned') {
        ctx.addIssue({
          code: 'custom',
          path: ['startDate'],
          message:
            'precision "month" requires a startDate inside the published period, used only for ordering. (Planned entries are the exception: the calendar publishes no dates at all, so they order by sortKey.)',
        });
      }
    }),
});

/* --------------------------------------------------------------- leadership */

const leadership = defineCollection({
  loader: glob({ base: './src/content/leadership', pattern: '**/*.json' }),
  schema: z.object({
    session: z.string().min(3),
    sourceIds: z.array(reference('sources')).min(1),
    /** Rendered above the groups; use for caveats such as missing photographs. */
    note: z.string().optional(),
    groups: z
      .array(
        z.object({
          id: z
            .string()
            .regex(/^[a-z0-9-]+$/, 'Use a lower-case kebab-case id'),
          heading: z.string().min(3),
          blurb: z.string().optional(),
          members: z
            .array(
              z.object({
                role: z.string().min(2).max(120),
                name: z.string().min(2).max(80),
                note: z.string().max(200).optional(),
              }),
            )
            .min(1),
        }),
      )
      .min(1),
  }),
});

export const collections = { sources, events, leadership };
