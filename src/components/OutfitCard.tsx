'use client';

import { useTranslations } from 'next-intl';
import { ArrowBigDown, ArrowBigUp } from 'lucide-react';

export type OutfitCardData = {
  id: string;
  title: string;
  photoUrl: string;
  upvotes: number;
  downvotes: number;
  taggedPieceCount?: number;
  isFresh?: boolean;
};

type Props = {
  outfit: OutfitCardData;
};

export function OutfitCard({ outfit }: Props) {
  const t = useTranslations();
  const score = outfit.upvotes - outfit.downvotes;

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-pink-100 bg-white shadow-sm transition-shadow hover:shadow-md">
      {outfit.isFresh && (
        <span className="absolute left-3 top-3 z-10 rounded-full bg-pink-300 px-2 py-0.5 text-xs font-bold uppercase tracking-wider">
          {t('home.fresh')}
        </span>
      )}

      <div className="relative aspect-[3/4] w-full bg-pink-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={outfit.photoUrl}
          alt={outfit.title}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>

      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-medium">{outfit.title}</h3>
          {outfit.taggedPieceCount ? (
            <span className="shrink-0 rounded-full bg-pink-100 px-2 py-0.5 text-[10px] font-medium">
              {outfit.taggedPieceCount} {t('outfit.taggedPieces').toLowerCase()}
            </span>
          ) : null}
        </div>

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
      </div>
    </article>
  );
}
