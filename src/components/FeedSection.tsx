'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CitySelector } from './CitySelector';
import { PieceCard, type PieceCardData } from './PieceCard';
import { OutfitCard, type OutfitCardData } from './OutfitCard';
import { EmptyState } from './EmptyState';

type Props =
  | {
      kind: 'pieces';
      defaultCity: string;
      items: PieceCardData[];
    }
  | {
      kind: 'outfits';
      defaultCity: string;
      items: OutfitCardData[];
    };

export function FeedSection(props: Props) {
  const t = useTranslations('home');
  const [city, setCity] = useState(props.defaultCity);

  const title =
    props.kind === 'pieces' ? t('trendingPieces') : t('trendingOutfits');
  const shareLabel =
    props.kind === 'pieces' ? t('sharePiece') : t('shareOutfit');
  const shareHref =
    props.kind === 'pieces' ? '/submit/piece' : '/submit/outfit';

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
        <div className="flex items-center gap-2">
          <CitySelector value={city} onChange={setCity} />
          <Link
            href={shareHref}
            className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-white hover:bg-foreground/80"
          >
            <Plus className="size-4" />
            {shareLabel}
          </Link>
        </div>
      </div>

      {props.items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {props.kind === 'pieces'
            ? props.items.map((p) => <PieceCard key={p.id} piece={p} />)
            : props.items.map((o) => <OutfitCard key={o.id} outfit={o} />)}
        </div>
      )}
    </section>
  );
}
