'use server';

import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signOut() {
  const locale = await getLocale();
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect({ href: '/', locale });
}

export async function updateHomeCity(formData: FormData) {
  const slug = String(formData.get('citySlug') ?? '').trim();
  if (!slug) return;

  const locale = await getLocale();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({ href: '/login', locale });
    return;
  }

  const { data: city } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!city) return;

  await supabase
    .from('users')
    .update({ home_city_id: city.id })
    .eq('id', user.id);
}
