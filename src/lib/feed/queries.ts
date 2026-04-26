import { createClient } from '@/lib/supabase/server';
import {
  interleaveFresh,
  FRESH_SLOT_EVERY,
  type RankableItem,
} from './ranking';
import type { Database } from '@/types/database.types';

type PieceRow = Database['public']['Tables']['pieces']['Row'];
type OutfitRow = Database['public']['Tables']['outfits']['Row'];

export type FeedItem = (PieceRow | OutfitRow) & RankableItem;

type Args = {
  citySlug: string;
  kind: 'pieces' | 'outfits';
  limit?: number;
};

/**
 * Fetch ranked + fresh items via Supabase RPCs and interleave them.
 * Pass `citySlug: 'global'` for the cross-city feed (sent as null to RPC).
 */
export async function getHomeFeed({
  citySlug,
  kind,
  limit = 24,
}: Args): Promise<FeedItem[]> {
  const supabase = await createClient();
  const slugArg = citySlug === 'global' ? null : citySlug;

  const rankedFn = kind === 'pieces' ? 'ranked_pieces' : 'ranked_outfits';
  const freshFn = kind === 'pieces' ? 'fresh_pieces' : 'fresh_outfits';

  const [rankedRes, freshRes] = await Promise.all([
    supabase.rpc(rankedFn, { p_city_slug: slugArg, p_limit: limit }),
    supabase.rpc(freshFn, {
      p_city_slug: slugArg,
      p_limit: Math.ceil(limit / FRESH_SLOT_EVERY),
    }),
  ]);

  const ranked = (rankedRes.data ?? []).map(toRankable);
  const fresh = (freshRes.data ?? []).map(toRankable);

  return interleaveFresh(ranked, fresh, limit, FRESH_SLOT_EVERY) as FeedItem[];
}

function toRankable<T extends PieceRow | OutfitRow>(row: T): T & RankableItem {
  return {
    ...row,
    cityId: row.city_id,
    approvedAt: row.approved_at ?? row.created_at,
  } as T & RankableItem;
}
