'use client';

import { useTranslations } from 'next-intl';
import { ArrowBigDown, ArrowBigUp, ShoppingBag, Instagram } from 'lucide-react';
import type { PieceCardData } from './PieceCard';

type Props = {
  /** Live values from the form. All optional — we render placeholders. */
  title?: string;
  category?: PieceCardData['category'] | '';
  mediaType?: 'photo' | 'embed';
  photoUrl?: string | null;
  embedProvider?: 'instagram' | 'tiktok' | null;
  affiliateUrl?: string;
};

/**
 * Live preview of how a Piece will look in the feed once approved.
 * Mirrors PieceCard.tsx but is pure-presentational and reads form state.
 */
export function PiecePreviewCard({
  title,
  category,
  mediaType = 'photo',
  photoUrl,
  embedProvider,
  affiliateUrl,
}: Props) {
  const t = useTranslations();

  return (
    <article className="relative overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm">
      <span className="absolute left-3 top-3 z-10 rounded-full bg-pink-300 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
        {t('home.fresh')}
      </span>

      <div className="relative aspect-[3/4] w-full bg-pink-50">
        {mediaType === 'photo' && photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt="" className="size-full object-cover" />
        ) : mediaType === 'embed' && embedProvider ? (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-pink-400">
            <Instagram className="size-8" aria-hidden />
            <span className="text-xs">
              {embedProvider === 'tiktok'
                ? t('piece.viewOnTikTok')
                : t('piece.viewOnInstagram')}
            </span>
          </div>
        ) : (
          <div
            className="flex size-full items-center justify-center text-[10px] uppercase tracking-widest text-pink-400"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #fdf2f8 0 8px, #fce7f3 8px 9px)',
            }}
          >
            Piece photo
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium">
            {title?.trim() ? (
              title
            ) : (
              <span className="font-normal opacity-50">
                {t('submit.titlePlaceholder')}
              </span>
            )}
          </h3>
          {category ? (
            <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              {t(`piece.category.${category}` as 'piece.category.top')}
            </span>
          ) : null}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button type="button" className="rounded-full p-1.5" aria-label="Upvote" disabled>
              <ArrowBigUp className="size-5" />
            </button>
            <span className="min-w-6 text-center text-sm font-bold tabular-nums">0</span>
            <button type="button" className="rounded-full p-1.5" aria-label="Downvote" disabled>
              <ArrowBigDown className="size-5" />
            </button>
          </div>

          {affiliateUrl ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-medium text-white">
              <ShoppingBag className="size-3" />
              {t('piece.shopThis')}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
