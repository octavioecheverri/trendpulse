'use client';

import { useTranslations } from 'next-intl';
import { ArrowBigDown, ArrowBigUp, ShoppingBag } from 'lucide-react';

export type PieceCardData = {
  id: string;
  title: string;
  category:
    | 'top'
    | 'bottom'
    | 'dress'
    | 'outerwear'
    | 'shoes'
    | 'bag'
    | 'accessory'
    | 'jewelry'
    | 'headwear';
  mediaType: 'photo' | 'embed';
  photoUrl?: string;
  embedProvider?: 'instagram' | 'tiktok';
  embedUrl?: string;
  upvotes: number;
  downvotes: number;
  affiliateUrl?: string | null;
  isFresh?: boolean;
};

type Props = {
  piece: PieceCardData;
};

export function PieceCard({ piece }: Props) {
  const t = useTranslations();
  const score = piece.upvotes - piece.downvotes;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {piece.isFresh && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-pink-300 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
          {t('home.fresh')}
        </span>
      )}

      <div className="relative aspect-[3/4] w-full bg-pink-50">
        {piece.mediaType === 'photo' && piece.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={piece.photoUrl}
            alt={piece.title}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-sm text-pink-400">
            {piece.embedProvider === 'tiktok'
              ? t('piece.viewOnTikTok')
              : t('piece.viewOnInstagram')}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium">{piece.title}</h3>
          <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
            {t(`piece.category.${piece.category}` as 'piece.category.top')}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-pink-50"
              aria-label="Upvote"
            >
              <ArrowBigUp className="size-5" />
            </button>
            <span className="min-w-6 text-center text-sm font-bold tabular-nums">
              {score}
            </span>
            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-pink-50"
              aria-label="Downvote"
            >
              <ArrowBigDown className="size-5" />
            </button>
          </div>

          {piece.affiliateUrl && (
            <a
              href={`/r/${piece.id}`}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-white hover:bg-foreground/80"
            >
              <ShoppingBag className="size-3" />
              {t('piece.shopThis')}
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
