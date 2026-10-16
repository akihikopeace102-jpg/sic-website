import { getCollection, type CollectionEntry } from 'astro:content';

export type EventEntry = CollectionEntry<'events'>;
export type SourceEntry = CollectionEntry<'sources'>;

/**
 * Ordering rules.
 *
 * An event is ordered by its explicit `sortKey`, else its `startDate`, else
 * it has no order at all and falls to the end of the list sorted by title.
 * `sortKey`/`startDate` are never shown to the reader. Only `dateLabel` is.
 */
function orderKey(entry: EventEntry): string | undefined {
  return entry.data.sortKey ?? entry.data.startDate;
}

function hasOrder(entry: EventEntry): boolean {
  return orderKey(entry) !== undefined;
}

/** Newest first (or, for forward-looking lists, soonest first). */
export function ascending(a: EventEntry, b: EventEntry): number {
  if (!hasOrder(a) || !hasOrder(b)) {
    if (hasOrder(a)) return -1;
    if (hasOrder(b)) return 1;
    return a.data.title.localeCompare(b.data.title, 'en');
  }
  return orderKey(a)! < orderKey(b)! ? -1 : orderKey(a)! > orderKey(b)! ? 1 : 0;
}

/** Oldest first. */
export function descending(a: EventEntry, b: EventEntry): number {
  if (!hasOrder(a) || !hasOrder(b)) {
    if (hasOrder(a)) return 1;
    if (hasOrder(b)) return -1;
    return a.data.title.localeCompare(b.data.title, 'en');
  }
  return orderKey(b)! < orderKey(a)! ? -1 : orderKey(b)! > orderKey(a)! ? 1 : 0;
}

export type EventBuckets = {
  now: EventEntry[];
  recent: EventEntry[];
  archive: EventEntry[];
  undated: EventEntry[];
};

/**
 * `now` sorts soonest-first because those are the months still ahead.
 * `recent` and `archive` sort newest-first because those already happened.
 * `undated` has no date at all and sorts by title.
 */
export async function getEventBuckets(): Promise<EventBuckets> {
  const all = await getCollection('events');
  return {
    now: all.filter((e) => e.data.bucket === 'now').sort(ascending),
    recent: all.filter((e) => e.data.bucket === 'recent').sort(descending),
    archive: all.filter((e) => e.data.bucket === 'archive').sort(descending),
    undated: all
      .filter((e) => e.data.bucket === 'undated')
      .sort((a, b) => a.data.title.localeCompare(b.data.title, 'en')),
  };
}

export async function getEventsSorted(): Promise<EventEntry[]> {
  const all = await getCollection('events');
  return all.slice().sort((a, b) => {
    const bucketRank: Record<EventEntry['data']['bucket'], number> = {
      now: 0,
      recent: 1,
      archive: 2,
      undated: 3,
    };
    const rank = bucketRank[a.data.bucket] - bucketRank[b.data.bucket];
    if (rank !== 0) return rank;
    if (a.data.bucket === 'now') return ascending(a, b);
    if (a.data.bucket === 'undated') {
      return a.data.title.localeCompare(b.data.title, 'en');
    }
    return descending(a, b);
  });
}

/** `reference('sources')` fields store `{ collection, id }`; this returns the ids. */
export function sourceRefIds(refs: readonly { collection: string; id: string }[]): string[] {
  return refs.map((ref) => ref.id);
}

export async function getSourceMap(): Promise<Map<string, SourceEntry>> {
  const sources = await getCollection('sources');
  return new Map(sources.map((s) => [s.id, s]));
}

/** Short label used in an attribution line. */
export function sourceLabel(source: SourceEntry): string {
  return source.data.title;
}

/**
 * The link an event points at, preferring registration over information,
 * because that is the one a reader acts on.
 */
export function primaryLink(data: EventEntry['data']) {
  const links = data.links;
  if (links.length === 0) return undefined;
  const rank = { registration: 0, information: 1 } as const;
  return links.slice().sort((a, b) => rank[a.kind] - rank[b.kind])[0];
}
