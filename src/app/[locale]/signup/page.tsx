import { setRequestLocale, getTranslations } from 'next-intl/server';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Link } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

export default async function SignupPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');

  return (
    <>
      <Header />
      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
        <h1 className="font-serif text-4xl">{t('signupTitle')}</h1>
        {/* TODO(auth): Supabase signUp + age gate validation + Beehiiv newsletter opt-in */}
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
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1" />
            {t('ageConfirmation')}
          </label>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" required className="mt-1" />
            {t('agreeToTerms')}
          </label>
          <button
            type="submit"
            className="mt-2 rounded-full bg-foreground px-4 py-2.5 font-medium text-white"
          >
            {t('signupTitle')}
          </button>
        </form>
        <p className="text-center text-sm">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="underline">
            {t('loginTitle')}
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
