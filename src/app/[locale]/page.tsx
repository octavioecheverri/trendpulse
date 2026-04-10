import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeedSection } from '@/components/FeedSection';
import { NewsletterBanner } from '@/components/NewsletterBanner';
import { STUB_PIECES, STUB_OUTFITS } from '@/lib/feed/stub-data';

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // TODO(supabase): replace with rankFeed({ kind: 'pieces', cityId, limit: 24 })
  // TODO(geoloc): use middleware-detected city instead of hardcoded 'tokyo'
  const defaultCity = 'tokyo';

  return (
    <>
      <Header loggedIn={false} />
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        <FeedSection
          kind="pieces"
          defaultCity={defaultCity}
          items={STUB_PIECES}
        />
        <FeedSection
          kind="outfits"
          defaultCity={defaultCity}
          items={STUB_OUTFITS}
        />
      </main>
      <NewsletterBanner />
      <Footer />
    </>
  );
}
