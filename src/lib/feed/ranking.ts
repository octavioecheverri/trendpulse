/**
 * Feed ranking — hybrid hot decay + fresh slot injection.
 *
 * See docs/trendpulse_business_plan_v2.docx and the plan at
 * /Users/octavioecheverri/.claude/plans/mellow-twirling-robin.md for the
 * product rationale.
 *
 * Hot score (per-city):
 *   raw   = max(upvotes - downvotes, 0)
 *   hot   = raw / (hours_old + 2)^1.5
 *
 * Global feed additionally boosts items that appear in multiple cities:
 *   hot_global = (raw + 2 * distinct_cities_bonus) / (hours_old + 2)^1.5
 *
 * Fresh slot injection: every FRESH_SLOT_EVERY positions in the ranked feed
 * we swap in a randomly chosen item from the fresh pool — items approved in
 * the last 24h with <FRESH_MAX_VOTES interactions. This guarantees cold-start
 * exposure without destroying the main ranking.
 */

export const FRESH_SLOT_EVERY = 5;
export const FRESH_MAX_VOTES = 3;
export const FRESH_WINDOW_HOURS = 24;

export type RankableItem = {
  id: string;
  upvotes: number;
  downvotes: number;
  approvedAt: Date | string;
  cityId: string;
};

export function hotScore(item: RankableItem, now: Date = new Date()): number {
  const raw = Math.max(item.upvotes - item.downvotes, 0);
  const approvedAt =
    item.approvedAt instanceof Date ? item.approvedAt : new Date(item.approvedAt);
  const hoursOld = (now.getTime() - approvedAt.getTime()) / (1000 * 60 * 60);
  return raw / Math.pow(hoursOld + 2, 1.5);
}

/**
 * Interleave ranked items with fresh items at every `freshSlotEvery` position.
 * Fresh items are spliced from the `freshPool` without replacement — once used,
 * they are removed so the same fresh item doesn't appear twice.
 */
export function interleaveFresh<T extends RankableItem>(
  ranked: T[],
  freshPool: T[],
  limit: number,
  freshSlotEvery: number = FRESH_SLOT_EVERY
): T[] {
  const result: T[] = [];
  const usedFreshIds = new Set<string>();
  const pool = [...freshPool];
  let rankedIdx = 0;

  for (let i = 0; i < limit; i++) {
    const shouldInjectFresh = (i + 1) % freshSlotEvery === 0 && pool.length > 0;
    if (shouldInjectFresh) {
      const fresh = pool.shift()!;
      usedFreshIds.add(fresh.id);
      result.push(fresh);
      continue;
    }

    // Skip ranked items that are already used in a fresh slot
    while (
      rankedIdx < ranked.length &&
      usedFreshIds.has(ranked[rankedIdx].id)
    ) {
      rankedIdx++;
    }

    if (rankedIdx < ranked.length) {
      result.push(ranked[rankedIdx]);
      rankedIdx++;
    } else if (pool.length > 0) {
      // Ranked exhausted — fall back to fresh
      const fresh = pool.shift()!;
      result.push(fresh);
    } else {
      break;
    }
  }

  return result;
}

export function rankByHot<T extends RankableItem>(items: T[], now: Date = new Date()): T[] {
  return [...items].sort((a, b) => hotScore(b, now) - hotScore(a, now));
}
