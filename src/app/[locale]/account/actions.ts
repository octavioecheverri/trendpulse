'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: '/', locale });
}

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfile(formData: FormData): Promise<UpdateProfileResult> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const citySlug = String(formData.get('citySlug') ?? '').trim();

  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: '/login', locale });
    return { ok: false, error: 'unauthenticated' };
  }

  let cityId: string | null = null;
  if (citySlug) {
    const { data: city, error: cityErr } = await supabase
      .from('cities')
      .select('id')
      .eq('slug', citySlug)
      .single();
    if (cityErr || !city) {
      console.error('city lookup failed', cityErr);
      return { ok: false, error: 'city-not-found' };
    }
    cityId = city.id;
  }

  // Upsert handles the (rare) case where the auth.users -> public.users
  // trigger didn't run for this user. We fall back to update if upsert
  // would conflict on RLS.
  const { error: upsertErr } = await supabase
    .from('users')
    .upsert(
      {
        id: user.id,
        display_name: displayName || null,
        home_city_id: cityId,
      },
      { onConflict: 'id' }
    );

  if (upsertErr) {
    console.error('profile upsert failed', upsertErr);
    return { ok: false, error: upsertErr.message };
  }

  revalidatePath('/[locale]/account', 'page');
  return { ok: true };
}
