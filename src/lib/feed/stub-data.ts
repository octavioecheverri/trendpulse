/**
 * Stub data for development before Supabase tables are wired up.
 * Replace with `rankFeed()` calls against the live DB once auth + storage exist.
 */

import type { PieceCardData } from '@/components/PieceCard';
import type { OutfitCardData } from '@/components/OutfitCard';

export const STUB_PIECES: PieceCardData[] = [
  {
    id: 'p1',
    title: 'Oversized cargo skirt with side pockets',
    category: 'bottom',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=600',
    upvotes: 87,
    downvotes: 4,
    affiliateUrl: 'https://example.com',
  },
  {
    id: 'p2',
    title: 'Sheer polka dot blouse',
    category: 'top',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=600',
    upvotes: 62,
    downvotes: 3,
    affiliateUrl: null,
  },
  {
    id: 'p3',
    title: 'Chunky platform mary janes',
    category: 'shoes',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600',
    upvotes: 54,
    downvotes: 6,
    affiliateUrl: 'https://example.com',
  },
  {
    id: 'p4',
    title: 'Micro pearl handbag',
    category: 'bag',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    upvotes: 1,
    downvotes: 0,
    affiliateUrl: null,
    isFresh: true,
  },
  {
    id: 'p5',
    title: 'Knit balaclava in butter yellow',
    category: 'headwear',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1485518882345-15568b007407?w=600',
    upvotes: 41,
    downvotes: 2,
    affiliateUrl: null,
  },
  {
    id: 'p6',
    title: 'Asymmetric ruffled mini dress',
    category: 'dress',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600',
    upvotes: 33,
    downvotes: 1,
    affiliateUrl: 'https://example.com',
  },
  {
    id: 'p7',
    title: 'Vintage denim jacket',
    category: 'outerwear',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1542272604-787c3835535d?w=600',
    upvotes: 28,
    downvotes: 0,
    affiliateUrl: null,
  },
  {
    id: 'p8',
    title: 'Layered chrome pendants',
    category: 'jewelry',
    mediaType: 'photo',
    photoUrl:
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600',
    upvotes: 0,
    downvotes: 0,
    affiliateUrl: null,
    isFresh: true,
  },
];

export const STUB_OUTFITS: OutfitCardData[] = [
  {
    id: 'o1',
    title: 'Soft pink monochrome with pearls',
    photoUrl:
      'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600',
    upvotes: 71,
    downvotes: 3,
    taggedPieceCount: 4,
  },
  {
    id: 'o2',
    title: 'Y2K denim & chrome',
    photoUrl:
      'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
    upvotes: 58,
    downvotes: 5,
    taggedPieceCount: 5,
  },
  {
    id: 'o3',
    title: 'Cottagecore picnic look',
    photoUrl:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600',
    upvotes: 42,
    downvotes: 2,
    taggedPieceCount: 3,
  },
  {
    id: 'o4',
    title: 'Tokyo street layered tailoring',
    photoUrl:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
    upvotes: 2,
    downvotes: 0,
    taggedPieceCount: 0,
    isFresh: true,
  },
];
