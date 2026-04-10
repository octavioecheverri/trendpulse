'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { CITIES } from '@/lib/i18n/cities';
import { MapPin } from 'lucide-react';

type Props = {
  value: string;
  onChange: (slug: string) => void;
};

const STORAGE_KEY = 'trendpulse:city';

export function CitySelector({ value, onChange }: Props) {
  const t = useTranslations();

  // Restore saved city on mount (runs once)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && saved !== value && CITIES.some((c) => c.slug === saved)) {
      onChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleChange(slug: string) {
    onChange(slug);
    localStorage.setItem(STORAGE_KEY, slug);
  }

  return (
    <label className="inline-flex items-center gap-2 rounded-full border border-pink-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-pink-50">
      <MapPin className="size-4" />
      <span className="sr-only">{t('home.selectCity')}</span>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        className="cursor-pointer bg-transparent focus:outline-none"
      >
        {CITIES.map((c) => (
          <option key={c.slug} value={c.slug}>
            {t(`cities.${c.slug}` as 'cities.tokyo')}
          </option>
        ))}
      </select>
    </label>
  );
}
