import { setRequestLocale } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

type Props = { params: Promise<{ locale: string }> };

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-12 prose">
        <h1 className="font-serif text-4xl">Privacy Policy</h1>
        <p className="mt-4 text-sm opacity-70">Last updated: 2026-04-09</p>
        <p className="mt-6">
          TrendPulse respects your privacy. This page will be expanded with the
          full policy before public launch. We process data via Supabase
          (database + auth), Vercel (hosting), PostHog (analytics, opt-in only)
          and Beehiiv (newsletter, opt-in only).
        </p>
        <p className="mt-4">
          You can request deletion of your account and all associated data
          anytime from the Account menu.
        </p>
      </main>
      <Footer />
    </>
  );
}
