import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { FeedSection } from '@/components/FeedSection';
import { NewsletterBanner } from '@/components/NewsletterBanner';
import { createClient } from '@/lib/supabase/server';
import { getHomeFeed } from '@/lib/feed/queries';
import type { PieceCardData } from '@/components/PieceCard';
import type { OutfitCardData } from '@/components/OutfitCard';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ city?: string; code?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function HomePage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { city, code } = await searchParams;
  setRequestLocale(locale);

  // Fallback for misconfigured Supabase Site URL: if a magic-link `?code=`
  // lands at the home page (root), forward it to the proper callback handler.
  if (code) redirect(`/auth/callback?code=${encodeURIComponent(code)}` as never);

  const citySlug = city ?? 'global';

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [pieces, outfits] = await Promise.all([
    getHomeFeed({ citySlug, kind: 'pieces', limit: 24 }),
    getHomeFeed({ citySlug, kind: 'outfits', limit: 12 }),
  ]);

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
        <FeedSection
          kind="pieces"
          defaultCity={citySlug}
          items={pieces as unknown as PieceCardData[]}
        />
        <FeedSection
          kind="outfits"
          defaultCity={citySlug}
          items={outfits as unknown as OutfitCardData[]}
        />
      </main>
      <NewsletterBanner />
      <Footer />
    </>
  );
}
