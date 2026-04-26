import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { CITIES } from '@/lib/i18n/cities';
import { createClient } from '@/lib/supabase/server';
import { signOut, updateHomeCity } from './actions';

type Props = { params: Promise<{ locale: string }> };

export const dynamic = 'force-dynamic';

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('account');
  const tc = await getTranslations('cities');

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
    .select('home_city_id, cities:home_city_id(slug)')
    .eq('id', user.id)
    .single();

  const currentSlug =
    (profile?.cities as { slug: string } | null)?.slug ?? '';

  return (
    <>
      <Header user={user} />
      <main className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16">
        <div className="space-y-1">
          <h1 className="font-serif text-4xl">{t('title')}</h1>
          <p className="text-sm opacity-80">{user.email}</p>
        </div>

        <form action={updateHomeCity} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('homeCity')}
            <select
              name="citySlug"
              defaultValue={currentSlug}
              className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
            >
              <option value="" disabled>
                —
              </option>
              {CITIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {tc(c.slug as 'tokyo')}
                </option>
              ))}
            </select>
            <span className="text-xs opacity-60">{t('homeCityHint')}</span>
          </label>
          <button
            type="submit"
            className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
          >
            {t('save')}
          </button>
        </form>

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
