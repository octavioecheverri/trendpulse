import { useTranslations } from 'next-intl';

type Props = {
  kind: 'pieces' | 'outfits';
  cityName: string;
};

export function EmptyState({ kind, cityName }: Props) {
  const t = useTranslations('home.emptyState');
  const titleKey = kind === 'pieces' ? 'piecesTitle' : 'outfitsTitle';
  return (
    <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-12 text-center">
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, #f9a8d4 1.5px, transparent 1.5px)',
          backgroundSize: '24px 24px',
        }}
        aria-hidden
      />
      <p className="relative font-serif text-lg italic text-pink-900">
        {t(titleKey, { city: cityName })}
      </p>
      <p className="relative mt-2 text-sm font-medium text-pink-900">
        {t('cta')}
      </p>
    </div>
  );
}
