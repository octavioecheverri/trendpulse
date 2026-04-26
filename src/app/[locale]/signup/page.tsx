import { redirect } from '@/i18n/navigation';

type Props = { params: Promise<{ locale: string }> };

// /signup is deprecated — magic link auto-creates accounts, so a single
// /login route handles both sign-in and sign-up. Preserved as a redirect
// for any external bookmarks.
export default async function SignupRedirect({ params }: Props) {
  const { locale } = await params;
  redirect({ href: '/login', locale });
}
