import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AccountForm } from '@/components/AccountForm';
import { createClient } from '@/lib/supabase/server';
import { signOut } from './actions';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('account');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: { pathname: '/login', query: { next: '/account' } }, locale });
    return null;
  }

  const { data: profile } = await supabase
    .from('users')
    .select('display_name, home_city_id')
    .eq('id', user.id)
    .maybeSingle();

  let currentSlug = '';
  if (profile?.home_city_id) {
    const { data: city } = await supabase
      .from('cities')
      .select('slug')
      .eq('id', profile.home_city_id)
      .maybeSingle();
    currentSlug = city?.slug ?? '';
  }

  const initialDisplayName = profile?.display_name ?? '';

  return (
    <>
      <Header user={user} />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl">{t('title')}</h1>
          <p className="text-sm opacity-80">{user.email}</p>
          <p className="text-xs opacity-60">{t('languageHint')}</p>
        </div>

        <AccountForm
          initialDisplayName={initialDisplayName}
          initialCitySlug={currentSlug}
        />

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-medium hover:bg-pink-50"
          >
            {t('signOut')}
          </button>
        </form>
      </main>
      <Footer />
    </>
  );
}
