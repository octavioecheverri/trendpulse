import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { LoginForm } from '@/components/LoginForm';
import { createClient } from '@/lib/supabase/server';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  // If already signed in, send them home.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect({ href: '/', locale });

  return (
    <>
      <Header user={null} />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <div className="space-y-2">
          <h1 className="font-serif text-4xl">{t('loginTitle')}</h1>
          <p className="text-sm opacity-80">{t('loginSubtitle')}</p>
        </div>
        <LoginForm />
      </main>
      <Footer />
    </>
  );
}
