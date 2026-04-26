import type { User } from '@supabase/supabase-js';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { AccountMenu } from './AccountMenu';

type Props = {
  user?: User | null;
};

export function Header({ user = null }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-pink-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Logo />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <AccountMenu user={user} />
        </div>
      </div>
    </header>
  );
}
