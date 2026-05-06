import { setRequestLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SubmitOutfitForm } from '@/components/SubmitOutfitForm';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function SubmitOutfitPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({
      href: { pathname: '/login', query: { next: '/submit/outfit' } },
      locale,
    });
    return null;
  }

  return (
    <>
      <Header user={user} />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <SubmitOutfitForm />
      </main>
      <Footer />
    </>
  );
}
