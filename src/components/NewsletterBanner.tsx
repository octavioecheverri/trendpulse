import { useTranslations } from 'next-intl';

export function NewsletterBanner() {
  const t = useTranslations('newsletter');
  const beehiivUrl = process.env.NEXT_PUBLIC_BEEHIIV_URL ?? '#';

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="relative overflow-hidden rounded-3xl bg-foreground p-8 text-white sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle, #f9a8d4 2px, transparent 2px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden
        />
        <div className="relative flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-serif text-2xl">{t('title')}</h3>
            <p className="mt-1 text-sm opacity-80">{t('subtitle')}</p>
          </div>
          <a
            href={beehiivUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-pink-300 px-5 py-2.5 text-sm font-bold text-foreground hover:bg-pink-400"
          >
            {t('subscribe')}
          </a>
        </div>
      </div>
    </section>
  );
}
