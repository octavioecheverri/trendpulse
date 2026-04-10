import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="font-serif text-4xl">{t('loginTitle')}</h1>
        {/* TODO(auth): wire up Supabase Auth (email+password + Google OAuth) */}
        <form className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            {t('email')}
            <input
              type="email"
              className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t('password')}
            <input
              type="password"
              className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
            />
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground px-4 py-2.5 font-medium text-white"
          >
            {t('loginTitle')}
          </button>
        </form>
        <div className="text-center text-sm opacity-70">{t('or')}</div>
        <button
          type="button"
          className="rounded-full border border-pink-200 bg-white px-4 py-2.5 font-medium"
        >
          {t('continueWithGoogle')}
        </button>
        <p className="text-center text-sm">
          {t('noAccount')}{' '}
          <Link href="/signup" className="underline">
            {t('signupTitle')}
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
