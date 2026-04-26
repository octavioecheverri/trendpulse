'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { User as UserIcon, LogOut, UserCircle } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import { signOut } from '@/app/[locale]/account/actions';

type Props = {
  user: User | null;
};

export function AccountMenu({ user }: Props) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full bg-pink-300 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-pink-400"
      >
        {t('login')}
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full border border-pink-200 bg-white px-3 py-1.5 text-sm font-medium hover:bg-pink-50"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <UserIcon className="size-4" />
        {t('account')}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-pink-100 bg-white p-1 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <Link
            href="/account"
            role="menuitem"
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-pink-50"
          >
            <UserCircle className="size-4" />
            {t('account')}
          </Link>
          <hr className="my-1 border-pink-100" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-pink-50"
            >
              <LogOut className="size-4" />
              {t('logout')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
