'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { updateProfile } from '@/app/[locale]/account/actions';
import { CITIES } from '@/lib/i18n/cities';

type Props = {
  initialDisplayName: string;
  initialCitySlug: string;
};

export function AccountForm({ initialDisplayName, initialCitySlug }: Props) {
  const t = useTranslations('account');
  const tc = useTranslations('cities');
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await updateProfile(formData);
      if (result.ok) {
        setStatus('saved');
        setErrorMsg('');
      } else {
        setStatus('error');
        setErrorMsg(result.error);
      }
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm">
        {t('displayName')}
        <input
          type="text"
          name="displayName"
          defaultValue={initialDisplayName}
          maxLength={50}
          autoComplete="nickname"
          placeholder={t('displayNamePlaceholder')}
          className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
        />
        <span className="text-xs opacity-60">{t('displayNameHint')}</span>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t('homeCity')}
        <select
          name="citySlug"
          defaultValue={initialCitySlug}
          className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
        >
          <option value="">—</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {tc(c.slug as 'tokyo')}
            </option>
          ))}
        </select>
        <span className="text-xs opacity-60">{t('homeCityHint')}</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? '…' : t('save')}
        </button>
        {status === 'saved' && (
          <span className="text-sm text-pink-700">{t('saved')}</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-600">{errorMsg || t('saveError')}</span>
        )}
      </div>
    </form>
  );
}
