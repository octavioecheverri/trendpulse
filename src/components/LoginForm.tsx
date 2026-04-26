'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { signInWithMagicLink } from '@/app/[locale]/login/actions';

export function LoginForm() {
  const t = useTranslations('auth');
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await signInWithMagicLink(formData);
      setStatus(result.ok ? 'sent' : 'error');
    });
  }

  if (status === 'sent') {
    return (
      <p className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm">
        {t('checkInbox')}
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        {t('email')}
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-full bg-foreground px-4 py-2.5 font-medium text-white disabled:opacity-50"
      >
        {pending ? '…' : t('sendMagicLink')}
      </button>
      {status === 'error' && (
        <p className="text-sm text-red-600">{t('errorGeneric')}</p>
      )}
    </form>
  );
}
