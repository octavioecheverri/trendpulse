'use client';

import { useRef, useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import {
  Upload, Link as LinkIcon, Camera, Check,
  ArrowLeft, AlertCircle,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { CITIES } from '@/lib/i18n/cities';
import { PiecePreviewCard } from './PiecePreviewCard';
import { submitPiece } from '@/app/[locale]/submit/piece/actions';

type Category =
  | 'top' | 'bottom' | 'dress' | 'outerwear'
  | 'shoes' | 'bag' | 'accessory' | 'jewelry' | 'headwear';

const CATEGORIES: Category[] = [
  'top', 'bottom', 'dress', 'outerwear',
  'shoes', 'bag', 'accessory', 'jewelry', 'headwear',
];

type FormState = {
  mediaType: 'photo' | 'embed';
  photoFile: File | null;
  photoPreview: string | null;
  embedUrl: string;
  title: string;
  description: string;
  citySlug: string;
  category: Category | '';
  affiliateUrl: string;
};

const INITIAL: FormState = {
  mediaType: 'photo',
  photoFile: null,
  photoPreview: null,
  embedUrl: '',
  title: '',
  description: '',
  citySlug: '',
  category: '',
  affiliateUrl: '',
};

function detectEmbed(url: string): 'instagram' | 'tiktok' | null {
  if (/instagram\.com\//i.test(url)) return 'instagram';
  if (/tiktok\.com\//i.test(url)) return 'tiktok';
  return null;
}

/**
 * V3 — "Smart paste" submit-piece flow.
 * Two steps: (1) one zone that accepts photo upload OR auto-detects an
 * Instagram/TikTok URL pasted into the text field. (2) details + sticky
 * preview card. After success, full-screen confirmation replaces the form.
 */
export function SubmitPieceForm() {
  const t = useTranslations();
  const tc = useTranslations('cities');
  const tcat = useTranslations('piece.category');

  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState<0 | 1>(0);
  const [pasted, setPasted] = useState('');
  const [submitted, setSubmitted] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<FormState>) {
    setForm((f) => ({ ...f, ...patch }));
  }

  async function onFileChosen(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image must be under 8 MB.');
      return;
    }
    setError(null);
    const url = URL.createObjectURL(file);
    update({
      mediaType: 'photo',
      photoFile: file,
      photoPreview: url,
      embedUrl: '',
    });
    setStep(1);
  }

  function onPaste(value: string) {
    setPasted(value);
    setError(null);
    const provider = detectEmbed(value);
    if (provider) {
      update({
        mediaType: 'embed',
        embedUrl: value,
        photoFile: null,
        photoPreview: null,
      });
      setStep(1);
    } else {
      update({ embedUrl: value });
    }
  }

  function reopenStep0() {
    update({ photoFile: null, photoPreview: null, embedUrl: '', mediaType: 'photo' });
    setPasted('');
    setStep(0);
  }

  const valid =
    form.title.trim().length >= 3 &&
    form.citySlug !== '' &&
    form.category !== '' &&
    ((form.mediaType === 'photo' && form.photoFile) ||
      (form.mediaType === 'embed' && detectEmbed(form.embedUrl)));

  function handleSubmit() {
    if (!valid) return;
    startTransition(async () => {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('description', form.description);
      fd.append('citySlug', form.citySlug);
      fd.append('category', form.category);
      fd.append('affiliateUrl', form.affiliateUrl);
      fd.append('embedUrl', form.embedUrl);
      if (form.photoFile) fd.append('photo', form.photoFile);

      const res = await submitPiece(fd);
      if (res.ok) {
        setSubmitted({ id: res.id });
      } else {
        setError(res.error);
      }
    });
  }

  if (submitted) return <SuccessScreen kind="piece" title={form.title} onAnother={() => {
    setForm(INITIAL); setStep(0); setPasted(''); setSubmitted(null); setError(null);
  }} />;

  return (
    <div className="pb-16">
      {/* Step 0 — paste or upload */}
      {step === 0 && (
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-7 pt-6 sm:pt-12">
          <p className="text-xs uppercase tracking-[0.18em] opacity-60">
            Step 1 of 2 · Add the visual
          </p>
          <h1 className="max-w-xl text-balance text-center font-serif text-3xl leading-tight tracking-tight sm:text-5xl">
            Drop a photo, or paste a link.
          </h1>
          <p className="max-w-md text-center text-sm leading-relaxed opacity-70">
            We figure out whether it’s an Instagram, TikTok or upload — you don’t pick.
          </p>

          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) await onFileChosen(f);
            }}
            className="flex w-full max-w-xl cursor-pointer flex-col items-center gap-3 rounded-[28px] border-[1.5px] border-dashed border-pink-200 bg-white px-6 py-10 transition-colors hover:bg-pink-50 sm:py-12"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFileChosen(e.target.files?.[0])}
            />
            <div className="relative flex size-16 items-center justify-center rounded-full bg-pink-50">
              <Upload className="size-7" />
              <span className="absolute -bottom-1 -right-1 flex size-7 items-center justify-center rounded-full border-[3px] border-background bg-pink-300">
                <Camera className="size-3.5" />
              </span>
            </div>
            <p className="text-base font-medium">
              <span className="hidden sm:inline">Drop a photo, or click to browse</span>
              <span className="inline sm:hidden">Tap to choose a photo</span>
            </p>
            <p className="text-xs opacity-60">JPG · PNG · WebP · up to 8 MB</p>
          </div>

          <div className="flex w-full max-w-xl items-center gap-3 opacity-60">
            <div className="h-px flex-1 bg-pink-100" />
            <span className="text-[11px] uppercase tracking-widest">or paste a link</span>
            <div className="h-px flex-1 bg-pink-100" />
          </div>

          <div className="relative w-full max-w-xl">
            <LinkIcon className="absolute left-4 top-1/2 size-4 -translate-y-1/2 opacity-50" />
            <input
              value={pasted}
              onChange={(e) => onPaste(e.target.value)}
              placeholder="https://www.instagram.com/p/… or tiktok.com/…"
              className="w-full rounded-full border border-pink-100 bg-white py-3.5 pl-11 pr-4 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-pink-100"
            />
            {pasted && (
              <p
                className={`mt-2 inline-flex items-center gap-1.5 text-xs ${
                  detectEmbed(pasted) ? 'opacity-70' : 'text-red-600'
                }`}
              >
                {detectEmbed(pasted) ? (
                  <>
                    <Check className="size-3.5" />
                    {detectEmbed(pasted)} link detected
                  </>
                ) : (
                  <>
                    <AlertCircle className="size-3.5" />
                    Must be an Instagram or TikTok URL.
                  </>
                )}
              </p>
            )}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </section>
      )}

      {/* Step 1 — details with sticky preview */}
      {step === 1 && (
        <section className="grid grid-cols-1 gap-6 sm:gap-9 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start">
            <p className="mb-3 text-[11px] uppercase tracking-widest opacity-60">
              Step 2 of 2
            </p>
            <div className="max-w-[220px]">
              <PiecePreviewCard
                title={form.title}
                category={form.category || undefined}
                mediaType={form.mediaType}
                photoUrl={form.photoPreview}
                embedProvider={form.mediaType === 'embed' ? detectEmbed(form.embedUrl) : null}
                affiliateUrl={form.affiliateUrl}
              />
            </div>
            <button
              onClick={reopenStep0}
              className="mt-3 inline-flex items-center gap-1 text-xs underline opacity-60 hover:opacity-100"
            >
              <ArrowLeft className="size-3" /> Replace photo / link
            </button>
          </aside>

          <div className="flex flex-col gap-5">
            <h1 className="text-balance font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
              Now, the details.
            </h1>

            <Field label={t('submit.title')}>
              <input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={t('submit.titlePlaceholder')}
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

              <Field label={t('submit.category')}>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORIES.map((c) => {
                    const sel = form.category === c;
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => update({ category: c })}
                        className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                          sel
                            ? 'border-foreground bg-foreground text-white'
                            : 'border-pink-100 bg-white hover:bg-pink-50'
                        }`}
                      >
                        {tcat(c as 'top')}
                      </button>
                    );
                  })}
                </div>
              </Field>
            </div>

            <Field label={t('submit.affiliateUrl')} optional>
              <input
                type="url"
                value={form.affiliateUrl}
                onChange={(e) => update({ affiliateUrl: e.target.value })}
                placeholder="https://"
                className="w-full rounded-2xl border border-pink-100 bg-white px-4 py-3 text-sm focus:border-foreground focus:outline-none focus:ring-2 focus:ring-pink-100"
              />
            </Field>

            {error && (
              <p className="inline-flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="size-4" /> {error}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                disabled={!valid || pending}
                onClick={handleSubmit}
                className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
              >
                {pending ? '…' : t('submit.submitButton')}
              </button>
              <span className="text-xs opacity-60">
                {valid ? 'Reviewed within ~24h.' : 'Add a title, city & category to continue.'}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
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

function SuccessScreen({
  kind, title, onAnother,
}: {
  kind: 'piece' | 'outfit';
  title: string;
  onAnother: () => void;
}) {
  const t = useTranslations();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-full bg-pink-300">
        <Check className="size-10" />
      </div>
      <h1 className="text-balance font-serif text-3xl tracking-tight sm:text-4xl">
        Sent for review
      </h1>
      <p className="max-w-sm text-sm leading-relaxed opacity-70">
        Your {kind} <em className="not-italic font-medium opacity-100">“{title || 'untitled'}”</em>{' '}
        is in review. {t('submit.pendingNotice')}
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        <button
          onClick={onAnother}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-white"
        >
          Submit another
        </button>
        <Link
          href="/"
          className="rounded-full border border-pink-100 bg-white px-5 py-2.5 text-sm font-medium hover:bg-pink-50"
        >
          Back to feed
        </Link>
      </div>
      <p className="mt-3 text-[11px] uppercase tracking-widest opacity-50">
        We’ll email you when it’s live
      </p>
    </div>
  );
}

// Re-export for outfit form to reuse
export { SuccessScreen as SubmitSuccessScreen };
