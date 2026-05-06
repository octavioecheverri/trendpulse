import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SubmitPieceForm } from '@/components/SubmitPieceForm';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function SubmitPiecePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({
      href: { pathname: '/login', query: { next: '/submit/piece' } },
      locale,
    });
    return null;
  }

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-5xl px-4 py-8">
        <SubmitPieceForm />
      </main>
      <Footer />
    </>
  );
}
