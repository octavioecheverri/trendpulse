import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

type Props = { params: Promise<{ locale: string }> };

export default async function TermsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 prose">
        <h1 className="font-serif text-4xl">Terms of Service</h1>
        <p className="mt-4 text-sm opacity-70">Last updated: 2026-04-09</p>
        <p className="mt-6">
          By using TrendPulse you confirm that you are 13 years or older and
          that any content you submit is yours to share. We reserve the right
          to remove content that violates our community guidelines.
        </p>
      </main>
      <Footer />
    </>
  );
}
