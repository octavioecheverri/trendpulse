import { describe, it, expect } from 'vitest';
import {
  hotScore,
  rankByHot,
  interleaveFresh,
  type RankableItem,
} from '@/lib/feed/ranking';

const NOW = new Date('2026-04-09T18:00:00Z');
const cityA = 'city-a';

function item(
  id: string,
  upvotes: number,
  downvotes: number,
  hoursOld: number,
): RankableItem {
  return {
    id,
    upvotes,
    downvotes,
    cityId: cityA,
    approvedAt: new Date(NOW.getTime() - hoursOld * 3600 * 1000),
  };
}

describe('hotScore', () => {
  it('decays with age', () => {
    const fresh = item('a', 10, 0, 1);
    const old = item('b', 10, 0, 48);
    expect(hotScore(fresh, NOW)).toBeGreaterThan(hotScore(old, NOW));
  });

  it('clamps negative scores to zero', () => {
    const trolled = item('c', 0, 50, 1);
    expect(hotScore(trolled, NOW)).toBe(0);
  });

  it('zero votes yields zero score', () => {
    const empty = item('d', 0, 0, 0.5);
    expect(hotScore(empty, NOW)).toBe(0);
  });
});

describe('rankByHot', () => {
  it('orders items by hot score descending', () => {
    const items = [
      item('a', 5, 0, 6), // moderate but recent
      item('b', 100, 0, 240), // popular but ancient
      item('c', 20, 0, 3), // strong + fresh
    ];
    const ranked = rankByHot(items, NOW);
    expect(ranked.map((i) => i.id)).toEqual(['c', 'a', 'b']);
  });
});

describe('interleaveFresh', () => {
  it('injects a fresh slot every Nth position', () => {
    const ranked = Array.from({ length: 10 }, (_, i) => item(`r${i}`, 50, 0, 12));
    const fresh = [item('f1', 0, 0, 1), item('f2', 1, 0, 2)];
    const result = interleaveFresh(ranked, fresh, 10, 5);
    expect(result[4].id).toBe('f1'); // index 4 = position 5
    expect(result[9].id).toBe('f2'); // index 9 = position 10
    expect(result.length).toBe(10);
  });

  it('fills with ranked items when fresh pool empty', () => {
    const ranked = Array.from({ length: 5 }, (_, i) => item(`r${i}`, 10, 0, 6));
    const result = interleaveFresh(ranked, [], 5, 5);
    expect(result.map((i) => i.id)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4']);
  });

  it('does not duplicate fresh items in ranked stream', () => {
    const shared = item('shared', 0, 0, 1);
    const ranked = [shared, item('r1', 10, 0, 12)];
    const result = interleaveFresh(ranked, [shared], 5, 1);
    const ids = result.map((i) => i.id);
    const sharedCount = ids.filter((id) => id === 'shared').length;
    expect(sharedCount).toBe(1);
  });
});
