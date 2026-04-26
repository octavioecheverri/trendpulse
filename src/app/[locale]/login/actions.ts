'use server';

import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type SignInResult = { ok: true } | { ok: false; error: 'generic' };

export async function signInWithMagicLink(formData: FormData): Promise<SignInResult> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email || !email.includes('@')) return { ok: false, error: 'generic' };

  const supabase = await createClient();
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host') ?? 'trendpul.se';
  const proto = hdrs.get('x-forwarded-proto') ?? 'https';
  const origin = `${proto}://${host}`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error('signInWithMagicLink failed', error);
    return { ok: false, error: 'generic' };
  }
  return { ok: true };
}
