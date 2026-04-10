'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { User, LogOut, KeyRound, Trash2, UserCircle } from 'lucide-react';

type Props = {
  loggedIn: boolean;
};

export function AccountMenu({ loggedIn }: Props) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);

  if (!loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-full px-3 py-1.5 text-sm font-medium hover:bg-pink-50"
        >
          {t('login')}
        </Link>
        <Link
          href="/signup"
          className="rounded-full bg-pink-300 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-pink-400"
        >
          {t('signup')}
        </Link>
      </div>
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
        <User className="size-4" />
        {t('account')}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-2xl border border-pink-100 bg-white p-1 shadow-lg"
          onMouseLeave={() => setOpen(false)}
        >
          <MenuItem href="/account" icon={<UserCircle className="size-4" />}>
            {t('myProfile')}
          </MenuItem>
          <MenuItem href="/account#submissions" icon={<UserCircle className="size-4" />}>
            {t('mySubmissions')}
          </MenuItem>
          <MenuItem href="/account#password" icon={<KeyRound className="size-4" />}>
            {t('changePassword')}
          </MenuItem>
          <hr className="my-1 border-pink-100" />
          <MenuItem href="/logout" icon={<LogOut className="size-4" />}>
            {t('logout')}
          </MenuItem>
          <MenuItem
            href="/account#delete"
            icon={<Trash2 className="size-4 text-red-500" />}
            danger
          >
            {t('deleteAccount')}
          </MenuItem>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  href,
  icon,
  children,
  danger,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm hover:bg-pink-50 ${
        danger ? 'text-red-600' : ''
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}
