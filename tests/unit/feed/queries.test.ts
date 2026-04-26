import { describe, it, expect, vi } from 'vitest';
import { getHomeFeed } from '@/lib/feed/queries';

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    rpc: vi.fn(async (name: string) => {
      if (name === 'ranked_pieces') {
        return {
          data: [
            { id: 'r1', upvotes: 10, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', created_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
            { id: 'r2', upvotes: 5, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', created_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
            { id: 'r3', upvotes: 3, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', created_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
            { id: 'r4', upvotes: 2, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', created_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
            { id: 'r5', upvotes: 1, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', created_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
          ],
          error: null,
        };
      }
      if (name === 'fresh_pieces') {
        return {
          data: [
            { id: 'f1', upvotes: 0, downvotes: 0, approved_at: '2026-04-26T00:00:00Z', created_at: '2026-04-26T00:00:00Z', city_id: 'c1' },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    }),
  })),
}));

describe('getHomeFeed', () => {
  it('interleaves fresh into ranked pieces every 5 positions', async () => {
    const items = await getHomeFeed({ citySlug: 'bogota', kind: 'pieces', limit: 5 });
    expect(items).toHaveLength(5);
    expect(items[4].id).toBe('f1');
  });

  it('returns empty array when both rpcs return empty', async () => {
    const { createClient } = await import('@/lib/supabase/server');
    vi.mocked(createClient).mockResolvedValueOnce({
      // @ts-expect-error partial mock
      rpc: vi.fn(async () => ({ data: [], error: null })),
    });
    const items = await getHomeFeed({ citySlug: 'bogota', kind: 'pieces', limit: 5 });
    expect(items).toEqual([]);
  });
});
