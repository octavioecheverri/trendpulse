'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload, Search, X, Check, AlertCircle, Plus, ArrowLeft,
} from 'lucide-react';
import { CITIES } from '@/lib/i18n/cities';
import {
  submitOutfit,
  searchPieces,
  type PieceSearchResult,
} from '@/app/[locale]/submit/outfit/actions';
import { SubmitSuccessScreen } from './SubmitPieceForm';

type Tag = {
  id: string; // local id
  pieceId: string;
  pieceTitle: string;
  pieceCategory: string;
  x: number; // 0..100 (% of photo)
  y: number;
};

type FormState = {
  photoFile: File | null;
  photoPreview: string | null;
  title: string;
  description: string;
  citySlug: string;
};

const INITIAL: FormState = {
  photoFile: null,
  photoPreview: null,
  title: '',
  description: '',
  citySlug: '',
};

/**
 * V3 — Outfit upload with pin-tagging.
 * Step 0: photo. Step 1: tap on photo to drop a pin → search → assign piece.
 *         Plus details panel (title, description, city) and submit.
 */
export function SubmitOutfitForm() {
  const t = useTranslations();
  const tc = useTranslations('cities');
  const tcat = useTranslations('piece.category');

  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState<0 | 1>(0);
  const [tags, setTags] = useState<Tag[]>([]);
  const [draftPin, setDraftPin] = useState<{ x: number; y: number } | null>(null);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PieceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Live search (debounced)
  useEffect(() => {
    if (!draftPin) return;
    let alive = true;
    setSearching(true);
    const id = window.setTimeout(async () => {
      const r = await searchPieces(search);
      if (!alive) return;
      setResults(r);
      setSearching(false);
    }, 220);
    return () => { alive = false; window.clearTimeout(id); };
  }, [search, draftPin]);

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  function onFileChosen(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (file.size > 8 * 1024 * 1024) { setError('Image must be under 8 MB.'); return; }
    setError(null);
    update({ photoFile: file, photoPreview: URL.createObjectURL(file) });
    setStep(1);
  }

  function onPhotoClick(e: React.MouseEvent<HTMLDivElement>) {
    if (draftPin) return; // search panel is open — close it via cancel
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setDraftPin({ x, y });
    setSearch('');
    setResults([]);
  }

  function commitTag(piece: PieceSearchResult) {
    if (!draftPin) return;
    setTags((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        pieceId: piece.id,
        pieceTitle: piece.title,
        pieceCategory: piece.category,
        x: draftPin.x,
        y: draftPin.y,
      },
    ]);
    setDraftPin(null);
    setSearch('');
    setResults([]);
  }

  function removeTag(id: string) {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  const valid =
    form.title.trim().length >= 3 &&
    form.citySlug !== '' &&
    !!form.photoFile;

  function handleSubmit() {
    if (!valid) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('citySlug', form.citySlug);
      fd.append('photo', form.photoFile!);
      fd.append('tags', JSON.stringify(tags.map((t) => ({
        pieceId: t.pieceId, x: t.x, y: t.y,
      }))));
      const res = await submitOutfit(fd);
      if (res.ok) setSubmitted({ id: res.id });
      else setError(res.error);
    });
  }

  if (submitted) return <SubmitSuccessScreen kind="outfit" title={form.title} onAnother={() => {
    setForm(INITIAL); setTags([]); setDraftPin(null); setSearch(''); setResults([]);
    setStep(0); setSubmitted(null); setError(null);
  }} />;

  return (
    <div className="pb-16">
      {step === 0 && (
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-7 pt-6 sm:pt-12">
          <p className="text-xs uppercase tracking-[0.18em] opacity-60">
            Step 1 of 2 · Outfit photo
          </p>
          <h1 className="max-w-xl text-balance text-center font-serif text-3xl leading-tight tracking-tight sm:text-5xl">
            One photo. Tag the pieces.
          </h1>
          <p className="max-w-md text-center text-sm leading-relaxed opacity-70">
            Upload your fit, then tap anywhere on the photo to pin a piece you’re wearing.
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); onFileChosen(e.dataTransfer.files?.[0]); }}
            className="flex w-full max-w-xl cursor-pointer flex-col items-center gap-3 rounded-[28px] border-[1.5px] border-dashed border-pink-200 bg-white px-6 py-12 transition-colors hover:bg-pink-50"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFileChosen(e.target.files?.[0])}
            />
            <div className="flex size-16 items-center justify-center rounded-full bg-pink-50">
              <Upload className="size-7" />
            </div>
            <p className="text-base font-medium">Drop a photo, or click to browse</p>
            <p className="text-xs opacity-60">JPG · PNG · WebP · up to 8 MB</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </section>
      )}

      {step === 1 && form.photoPreview && (
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          {/* Photo + pins */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-widest opacity-60">
                Step 2 · Tap the photo to pin pieces
              </p>
              <button
                type="button"
                onClick={() => { update({ photoFile: null, photoPreview: null }); setStep(0); setTags([]); setDraftPin(null); }}
                className="inline-flex items-center gap-1 text-xs underline opacity-60 hover:opacity-100"
              >
                <ArrowLeft className="size-3" /> Replace photo
              </button>
            </div>

            <div
              className="relative aspect-[3/4] w-full overflow-hidden rounded-3xl bg-pink-50 select-none"
              onClick={onPhotoClick}
              role="button"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.photoPreview} alt="" className="size-full object-cover pointer-events-none" />

              {/* Existing pins */}
              {tags.map((tag, i) => (
                <Pin
                  key={tag.id}
                  index={i + 1}
                  x={tag.x}
                  y={tag.y}
                  label={tag.pieceTitle}
                  category={tcat(tag.pieceCategory as 'top')}
                  onRemove={() => removeTag(tag.id)}
                />
              ))}

              {/* Draft pin / search */}
              {draftPin && (
                <DraftPin
                  x={draftPin.x}
                  y={draftPin.y}
                  search={search}
                  onSearch={setSearch}
                  results={results}
                  searching={searching}
                  onPick={commitTag}
                  onCancel={() => { setDraftPin(null); setSearch(''); setResults([]); }}
                  tcat={tcat}
                />
              )}

              {tags.length === 0 && !draftPin && (
                <div className="absolute inset-x-0 bottom-3 mx-auto w-fit rounded-full bg-foreground/85 px-3 py-1.5 text-xs text-white backdrop-blur">
                  Tap anywhere to start tagging
                </div>
              )}
            </div>

            {/* Tag chip list */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((tag, i) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-pink-100 px-2.5 py-1 text-xs"
                  >
                    <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-white">
                      {i + 1}
                    </span>
                    <span className="max-w-[140px] truncate">{tag.pieceTitle}</span>
                    <button
                      type="button"
                      onClick={() => removeTag(tag.id)}
                      className="opacity-50 hover:opacity-100"
                      aria-label="Remove tag"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Details panel */}
          <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
            <h2 className="text-balance font-serif text-2xl tracking-tight">Outfit details</h2>

            <Field label={t('submit.title')}>
              <input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={t('submit.outfitTitlePlaceholder')}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-pink-100"
                maxLength={120}
              />
            </Field>

            <Field label={t('submit.description')} optional>
              <textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder={t('submit.descriptionPlaceholder')}
                rows={3}
                className="w-full resize-y rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-pink-100"
                maxLength={600}
              />
            </Field>

            <Field label={t('submit.city')}>
              <select
                value={form.citySlug}
                onChange={(e) => update({ citySlug: e.target.value })}
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-pink-100"
              >
                <option value="" disabled>—</option>
                {CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {tc(c.slug as 'tokyo')}
                  </option>
                ))}
              </select>
            </Field>

            <div className="rounded-2xl border border-pink-100 bg-white px-4 py-3 text-xs opacity-70">
              <p className="font-medium opacity-100">Tags · {tags.length}</p>
              <p>Linking pieces helps shoppers find them. Optional but recommended.</p>
            </div>

            {error && (
              <p className="inline-flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="size-4" /> {error}
              </p>
            )}

            <button
              type="button"
              disabled={!valid || pending}
              onClick={handleSubmit}
              className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {pending ? '…' : t('submit.submitButton')}
            </button>
            <p className="text-[11px] opacity-50">
              {valid ? 'Reviewed within ~24h.' : 'Title & city required.'}
            </p>
          </aside>
        </section>
      )}
    </div>
  );
}

function Field({
  label, optional, children,
}: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-baseline gap-2">
        <span className="text-sm font-medium">{label}</span>
        {optional && <span className="text-[11px] opacity-50">Optional</span>}
      </span>
      {children}
    </label>
  );
}

function Pin({
  index, x, y, label, category, onRemove,
}: {
  index: number; x: number; y: number; label: string; category: string;
  onRemove: () => void;
}) {
  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${x}%`, top: `${y}%` }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        onClick={onRemove}
        className="group relative flex size-7 items-center justify-center rounded-full bg-foreground text-xs font-bold text-white shadow-lg ring-4 ring-background/60"
        aria-label={`Remove ${label}`}
      >
        <span className="group-hover:opacity-0">{index}</span>
        <X className="absolute size-3.5 opacity-0 group-hover:opacity-100" />
        <span className="pointer-events-none absolute left-9 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-white border border-pink-100 px-2.5 py-1 text-[11px] text-foreground shadow-sm">
          {label} <span className="opacity-50">· {category}</span>
        </span>
      </button>
    </div>
  );
}

function DraftPin({
  x, y, search, onSearch, results, searching, onPick, onCancel, tcat,
}: {
  x: number; y: number;
  search: string; onSearch: (s: string) => void;
  results: PieceSearchResult[]; searching: boolean;
  onPick: (p: PieceSearchResult) => void; onCancel: () => void;
  tcat: (k: string) => string;
}) {
  // Anchor popover so it stays inside the photo: flip to the left if pin is right of 60%.
  const anchorRight = x > 60;
  return (
    <div
      className="absolute z-20"
      style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Pulse */}
      <span className="absolute inset-0 -z-10 size-7 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full bg-pink-300 opacity-70" />
      <span className="flex size-7 items-center justify-center rounded-full bg-pink-300 text-foreground ring-4 ring-background/60">
        <Plus className="size-4" />
      </span>

      {/* Popover */}
      <div
        className={`absolute top-1/2 w-72 -translate-y-1/2 rounded-2xl border border-pink-100 bg-white p-2 shadow-xl ${
          anchorRight ? 'right-9 mr-1' : 'left-9 ml-1'
        }`}
      >
        <div className="flex items-center gap-2 border-b border-pink-100 px-2 pb-2">
          <Search className="size-4 opacity-60" />
          <input
            autoFocus
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search pieces…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full p-1 opacity-50 hover:opacity-100"
            aria-label="Cancel"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-64 overflow-y-auto">
          {searching && (
            <p className="px-3 py-3 text-xs opacity-50">Searching…</p>
          )}
          {!searching && results.length === 0 && (
            <p className="px-3 py-3 text-xs opacity-50">
              {search ? 'No pieces match.' : 'Top pieces will appear as you type.'}
            </p>
          )}
          {results.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              className="flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-pink-50"
            >
              <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-pink-100">
                {p.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.photo_url} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{p.title}</p>
                <p className="text-[11px] opacity-60">{tcat(p.category)}</p>
              </div>
              <Check className="size-4 opacity-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
