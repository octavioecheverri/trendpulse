import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function Footer() {
  const t = useTranslations('legal');
  return (
    <footer className="border-t border-pink-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-sm sm:flex-row">
        <span className="opacity-60">© {new Date().getFullYear()} TrendPulse</span>
        <nav className="flex items-center gap-4">
          <Link href="/privacy" className="hover:underline">
            {t('privacy')}
          </Link>
          <Link href="/terms" className="hover:underline">
            {t('terms')}
          </Link>
        </nav>
      </div>
    </footer>
  );
}
