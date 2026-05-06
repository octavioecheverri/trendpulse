'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/types/database.types';

type PieceCategory =
  Database['public']['Enums']['piece_category'];
type EmbedProvider =
  Database['public']['Enums']['embed_provider'];

const VALID_CATEGORIES: PieceCategory[] = [
  'top', 'bottom', 'dress', 'outerwear',
  'shoes', 'bag', 'accessory', 'jewelry', 'headwear',
];

export type SubmitPieceResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

function detectEmbedProvider(url: string): EmbedProvider | null {
  if (/instagram\.com\//i.test(url)) return 'instagram';
  if (/tiktok\.com\//i.test(url)) return 'tiktok';
  return null;
}

export async function submitPiece(formData: FormData): Promise<SubmitPieceResult> {
  const locale = await getLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({
      href: { pathname: '/login', query: { next: '/submit/piece' } },
      locale,
    });
    return { ok: false, error: 'unauthenticated' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const citySlug = String(formData.get('citySlug') ?? '').trim();
  const category = String(formData.get('category') ?? '').trim() as PieceCategory;
  const affiliateUrl = String(formData.get('affiliateUrl') ?? '').trim();
  const embedUrl = String(formData.get('embedUrl') ?? '').trim();
  const photo = formData.get('photo');

  if (title.length < 3) return { ok: false, error: 'title-too-short' };
  if (!citySlug) return { ok: false, error: 'city-required' };
  if (!VALID_CATEGORIES.includes(category)) return { ok: false, error: 'invalid-category' };

  // Resolve city
  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  if (cityErr || !city) return { ok: false, error: 'city-not-found' };

  // Determine media
  let mediaType: 'photo' | 'embed';
  let photoUrl: string | null = null;
  let embedProvider: EmbedProvider | null = null;
  let resolvedEmbedUrl: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    mediaType = 'photo';
    if (photo.size > 8 * 1024 * 1024) return { ok: false, error: 'photo-too-large' };
    const ext = photo.name.split('.').pop() || 'jpg';
    const key = `pieces/${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase
      .storage
      .from('user-media')
      .upload(key, photo, { contentType: photo.type, upsert: false });
    if (upErr) return { ok: false, error: `upload-failed: ${upErr.message}` };
    const { data: pub } = supabase.storage.from('user-media').getPublicUrl(key);
    photoUrl = pub.publicUrl;
  } else if (embedUrl) {
    embedProvider = detectEmbedProvider(embedUrl);
    if (!embedProvider) return { ok: false, error: 'invalid-embed-url' };
    mediaType = 'embed';
    resolvedEmbedUrl = embedUrl;
  } else {
    return { ok: false, error: 'media-required' };
  }

  const { data: row, error: insertErr } = await supabase
    .from('pieces')
    .insert({
      author_id: user.id,
      title,
      description: description || null,
      category,
      city_id: city.id,
      media_type: mediaType,
      photo_url: photoUrl,
      embed_url: resolvedEmbedUrl,
      embed_provider: embedProvider,
      affiliate_url: affiliateUrl || null,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertErr || !row) return { ok: false, error: insertErr?.message || 'insert-failed' };

  revalidatePath('/[locale]/account/submissions', 'page');
  return { ok: true, id: row.id };
}
