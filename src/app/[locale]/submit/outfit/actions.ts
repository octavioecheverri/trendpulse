'use server';

import { revalidatePath } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

export type SubmitOutfitResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

type TagInput = { pieceId: string; x: number; y: number };

export async function submitOutfit(formData: FormData): Promise<SubmitOutfitResult> {
  const locale = await getLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect({
      href: { pathname: '/login', query: { next: '/submit/outfit' } },
      locale,
    });
    return { ok: false, error: 'unauthenticated' };
  }

  const title = String(formData.get('title') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const citySlug = String(formData.get('citySlug') ?? '').trim();
  const tagsRaw = String(formData.get('tags') ?? '[]');
  const photo = formData.get('photo');

  if (title.length < 3) return { ok: false, error: 'title-too-short' };
  if (!citySlug) return { ok: false, error: 'city-required' };
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: 'photo-required' };
  if (photo.size > 8 * 1024 * 1024) return { ok: false, error: 'photo-too-large' };

  let tags: TagInput[] = [];
  try {
    const parsed = JSON.parse(tagsRaw);
    if (Array.isArray(parsed)) tags = parsed;
  } catch {
    return { ok: false, error: 'invalid-tags' };
  }

  const { data: city, error: cityErr } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();
  if (cityErr || !city) return { ok: false, error: 'city-not-found' };

  // Upload photo
  const ext = photo.name.split('.').pop() || 'jpg';
  const key = `outfits/${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase
    .storage
    .from('user-media')
    .upload(key, photo, { contentType: photo.type, upsert: false });
  if (upErr) return { ok: false, error: `upload-failed: ${upErr.message}` };
  const { data: pub } = supabase.storage.from('user-media').getPublicUrl(key);

  const { data: row, error: insertErr } = await supabase
    .from('outfits')
    .insert({
      author_id: user.id,
      title,
      description: description || null,
      city_id: city.id,
      photo_url: pub.publicUrl,
      status: 'pending',
    })
    .select('id')
    .single();

  if (insertErr || !row) return { ok: false, error: insertErr?.message || 'insert-failed' };

  // Tag pieces (best-effort; outfit insert succeeded already)
  if (tags.length > 0) {
    const rows = tags
      .filter((t) => typeof t.pieceId === 'string')
      .map((t) => ({
        outfit_id: row.id,
        piece_id: t.pieceId,
        position_x: Math.max(0, Math.min(100, Number(t.x) || 0)),
        position_y: Math.max(0, Math.min(100, Number(t.y) || 0)),
      }));
    if (rows.length > 0) {
      const { error: tagErr } = await supabase.from('outfit_pieces').insert(rows);
      if (tagErr) console.error('outfit_pieces insert failed', tagErr);
    }
  }

  revalidatePath('/[locale]/account/submissions', 'page');
  return { ok: true, id: row.id };
}

export type PieceSearchResult = {
  id: string;
  title: string;
  category: string;
  photo_url: string | null;
};

export async function searchPieces(query: string): Promise<PieceSearchResult[]> {
  const supabase = await createClient();
  const q = query.trim();
  let req = supabase
    .from('pieces')
    .select('id, title, category, photo_url')
    .eq('status', 'approved')
    .order('upvotes', { ascending: false })
    .limit(8);
  if (q.length >= 1) req = req.ilike('title', `%${q}%`);
  const { data, error } = await req;
  if (error) {
    console.error('searchPieces failed', error);
    return [];
  }
  return data ?? [];
}
