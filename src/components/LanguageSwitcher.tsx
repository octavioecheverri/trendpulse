'use client';

import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { locales, localeNames, localeFlags, type Locale } from '@/i18n/config';

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <label className="inline-flex items-center gap-1">
      <span className="sr-only">Language</span>
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value as Locale)}
        disabled={isPending}
        className="cursor-pointer rounded-full border border-pink-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-pink-50 focus:outline-none focus:ring-2 focus:ring-pink-300 disabled:opacity-50"
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {localeFlags[l]} {localeNames[l]}
          </option>
        ))}
      </select>
    </label>
  );
}
