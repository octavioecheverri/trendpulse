# Phase 2 — Auth + Real Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace stub data with real Supabase queries, wire magic-link authentication, and enable empty-state UX so an external user can sign in and see real (or empty) feed for their city.

**Architecture:** Full `@supabase/ssr` pattern for Next.js App Router — session refresh in middleware, server components read session via `cookies()`, login uses Server Action calling `signInWithOtp`, callback exchanges code for cookies, `/account` is a protected server component. Home feed queries existing `ranked_pieces / ranked_outfits / fresh_pieces / fresh_outfits` RPCs and merges with the existing `interleaveFresh` helper. Google OAuth and geo-detection are Stage B follow-ups (separate tasks, optional this round).

**Tech Stack:** Next.js 16 App Router (existing), `@supabase/ssr@0.10.2` (already installed), `next-intl@4.9.0` (existing), Vitest (existing), Playwright (existing).

---

## Reality vs. spec — deltas to know

The 2026-04-22 spec was written before re-reading the code. These are the deltas the plan honors:

- **RPC signatures:** spec assumed `ranked_pieces(city_id_in, kind_in, limit_in)`. Reality: `ranked_pieces(p_city_slug text, p_limit integer)` + a separate `ranked_outfits(p_city_slug, p_limit)`. Plan calls them with `p_city_slug` (or `null` for global) and merges client-side.
- **`interleaveFresh` signature:** existing is `(ranked, freshPool, limit, freshSlotEvery)` not `({every: 5})`. Plan calls it positionally.
- **Existing files reused:** `src/lib/supabase/{client,server,admin}.ts`, `src/lib/feed/ranking.ts`, `src/lib/i18n/cities.ts`, `src/components/EmptyState.tsx` (refactored), `src/app/[locale]/login/page.tsx` (rewritten).
- **i18n keys already partly there:** existing `auth.*` keys cover password flow; we deprecate password keys we no longer use and add magic-link + empty-state keys, translating to all 7 locales.
- **`auth/callback` is locale-free:** lives at `src/app/auth/callback/route.ts` (outside `[locale]`) since it's a redirect target, not a user-facing page.

## Manual setup required (one-time, by user)

Before the magic link works in production:

1. **Supabase Dashboard → Authentication → URL Configuration** for both projects:
   - Dev (`gtsplqxkrqgpvvkzfpmf`): Site URL `http://localhost:3000`; Additional Redirect URLs include `http://localhost:3000/auth/callback`
   - Prod (`awofarhubyvdolipvyap`): Site URL `https://trendpul.se`; Additional Redirect URLs include `https://trendpul.se/auth/callback`
2. **Email templates:** keep Supabase defaults for Phase 2 (rate limit ~4/hour is fine for dogfood traffic).

The plan flags this as a non-code task. Code can be implemented and committed without it; the live test only works after step 1.

## Out of scope (Stage B / future phase)

- Google OAuth (needs Cloud Console setup; risk-mitigated per spec by shipping magic link alone first)
- Geo-detection `/api/geo` (functional fallback to `'global'` is acceptable for Stage A)
- Avatar upload, handle editing, delete account (Phase 3/6)
- PostHog/Sentry instrumentation (Phase 7)

---

## File map

**Create:**
- `src/lib/supabase/middleware.ts` — `updateSession(request)` cookie refresh helper
- `src/lib/feed/queries.ts` — `getHomeFeed({ citySlug, kind, limit })`
- `src/app/auth/callback/route.ts` — exchanges `?code` for session, redirects to `next` or `/`
- `src/app/[locale]/account/page.tsx` — protected page: email, home city select, logout
- `src/components/LoginForm.tsx` — client component with email input + Server Action submit
- `src/app/[locale]/login/actions.ts` — `signInWithMagicLink(formData)` Server Action
- `src/app/[locale]/account/actions.ts` — `signOut()` + `updateHomeCity(formData)` Server Actions
- `tests/unit/feed/queries.test.ts` — mocks Supabase, asserts interleave call
- `tests/e2e/login-magic-link.spec.ts` — `/login` form renders + form submit shows confirmation
- `tests/e2e/account-protected.spec.ts` — anonymous `/account` redirects to login

**Modify:**
- `middleware.ts` — call `updateSession` then run `next-intl` middleware, merging cookies
- `src/app/[locale]/page.tsx` — replace stub imports with `getHomeFeed`; pass real data
- `src/app/[locale]/layout.tsx` — resolve `user` server-side, pass to `Header`
- `src/components/Header.tsx` — accept `user` prop instead of `loggedIn`
- `src/components/AccountMenu.tsx` — branch on `user`; remove `/signup`, change-password, delete-account links (deferred phases)
- `src/components/EmptyState.tsx` — accept `kind` + `cityName` props, use new i18n keys
- `src/components/FeedSection.tsx` — pass `kind` + `cityName` down to `EmptyState`
- `src/lib/supabase/server.ts` — keep existing pattern (no change needed; verified)
- `messages/{en,es,fr,pt,da,ja,ko}.json` — add new keys, prune deprecated password-flow keys
- `tests/e2e/home.smoke.spec.ts` — adjust assertions for empty-state copy after stubs removed

**Delete:**
- `src/app/[locale]/signup/page.tsx` — magic link auto-creates accounts; single `/login` route
- `src/lib/feed/stub-data.ts` — replaced by `queries.ts`

---

## Task order rationale

Tasks 1-3 establish the auth substrate (i18n keys + middleware + Supabase wiring) without breaking anything visible. Tasks 4-7 build the auth UI flow end-to-end. Tasks 8-11 swap stub data for real queries. Tasks 12-13 test, verify, commit, deploy. Each task ends with a working, committable state.

---

### Task 1: Add new i18n keys to all 7 locales

**Files:**
- Modify: `messages/en.json`
- Modify: `messages/es.json`
- Modify: `messages/fr.json`
- Modify: `messages/pt.json`
- Modify: `messages/da.json`
- Modify: `messages/ja.json`
- Modify: `messages/ko.json`

**New keys to add (under `auth`):**

```json
"auth": {
  "loginTitle": "Welcome back",                                  // existing, keep
  "loginSubtitle": "Sign in or sign up — we'll email you a link.",
  "email": "Email",                                              // existing, keep
  "sendMagicLink": "Send magic link",
  "checkInbox": "Check your inbox for the sign-in link.",
  "errorExpired": "This link has expired. Request a new one.",
  "errorGeneric": "Something went wrong. Try again.",
  "continueWithGoogle": "Continue with Google",                  // existing, keep
  "or": "or",                                                    // existing, keep
  "logoutConfirm": "Are you sure you want to log out?"           // existing, keep
}
```

**Keys to remove from `auth`** (no longer used after magic-link migration):
`signupTitle`, `password`, `confirmPassword`, `forgotPassword`, `ageConfirmation`, `agreeToTerms`, `alreadyHaveAccount`, `noAccount`, `resetPassword`, `resetPasswordPrompt`, `resetPasswordSuccess`.

**New keys to add (replace `home.empty`):**

```json
"home": {
  // ...existing keys remain...
  "emptyState": {
    "piecesTitle": "No trending pieces in {city} yet",
    "outfitsTitle": "No trending outfits in {city} yet",
    "cta": "Be the first to share"
  }
}
```

Remove `home.empty` from all 7 locales.

**New key under `nav`:** keep `login`, `logout`, `account`. Remove `signup`, `changePassword`, `deleteAccount`, `mySubmissions`, `myProfile` (deferred phases — keep them only if currently rendered; we'll prune in Task 7).

**New keys under `account`:**

```json
"account": {
  "title": "Your account",
  "homeCity": "Home city",
  "homeCityHint": "Used to personalize your feed.",
  "save": "Save",
  "saved": "Saved",
  "signOut": "Sign out"
}
```

Remove existing `account.handle`, `account.displayName`, `account.dangerZone`, `account.deleteAccountTitle`, `account.deleteAccountWarning`, `account.deleteAccountConfirm` (deferred phases).

- [ ] **Step 1.1: Edit `messages/en.json`** to apply additions + removals above.

- [ ] **Step 1.2: Translate manually** for the 6 other locales using these mappings (small enough that DeepL is overkill):

  | Key | es | fr | pt | da | ja | ko |
  |---|---|---|---|---|---|---|
  | `auth.loginSubtitle` | Inicia sesión o regístrate — te enviaremos un enlace por email. | Connectez-vous ou inscrivez-vous — nous vous enverrons un lien par e-mail. | Entre ou cadastre-se — vamos te enviar um link por e-mail. | Log ind eller tilmeld dig — vi sender dig et link på mail. | サインインまたは登録 — メールでリンクをお送りします。 | 로그인하거나 가입하세요 — 이메일로 링크를 보내드립니다. |
  | `auth.sendMagicLink` | Enviar enlace mágico | Envoyer le lien magique | Enviar link mágico | Send magisk link | マジックリンクを送信 | 매직 링크 보내기 |
  | `auth.checkInbox` | Revisa tu bandeja de entrada para el enlace de acceso. | Vérifiez votre boîte de réception pour le lien de connexion. | Confira sua caixa de entrada pelo link de acesso. | Tjek din indbakke for login-linket. | サインインリンクをメールで確認してください。 | 받은편지함에서 로그인 링크를 확인하세요. |
  | `auth.errorExpired` | Este enlace ha expirado. Solicita uno nuevo. | Ce lien a expiré. Demandez-en un nouveau. | Este link expirou. Solicite um novo. | Linket er udløbet. Anmod om et nyt. | このリンクは期限切れです。新しいものをリクエストしてください。 | 이 링크는 만료되었습니다. 새 링크를 요청하세요. |
  | `auth.errorGeneric` | Algo salió mal. Inténtalo de nuevo. | Une erreur s'est produite. Réessayez. | Algo deu errado. Tente novamente. | Noget gik galt. Prøv igen. | エラーが発生しました。もう一度お試しください。 | 문제가 발생했습니다. 다시 시도해주세요. |
  | `home.emptyState.piecesTitle` | Aún no hay piezas en tendencia en {city} | Aucune pièce tendance à {city} pour l'instant | Ainda não há peças em alta em {city} | Ingen populære stykker i {city} endnu | {city}でトレンドのアイテムはまだありません | 아직 {city}에서 트렌드 아이템이 없습니다 |
  | `home.emptyState.outfitsTitle` | Aún no hay outfits en tendencia en {city} | Aucune tenue tendance à {city} pour l'instant | Ainda não há looks em alta em {city} | Ingen populære outfits i {city} endnu | {city}でトレンドのコーデはまだありません | 아직 {city}에서 트렌드 코디가 없습니다 |
  | `home.emptyState.cta` | Sé el primero en compartir | Soyez le premier à partager | Seja o primeiro a compartilhar | Vær den første til at dele | 最初にシェアしましょう | 가장 먼저 공유하세요 |
  | `account.title` | Tu cuenta | Votre compte | Sua conta | Din konto | あなたのアカウント | 내 계정 |
  | `account.homeCity` | Ciudad principal | Ville principale | Cidade principal | Hjemmeby | ホームシティ | 홈 도시 |
  | `account.homeCityHint` | Se usa para personalizar tu feed. | Utilisé pour personnaliser votre feed. | Usada para personalizar seu feed. | Bruges til at tilpasse dit feed. | フィードのパーソナライズに使用されます。 | 피드 개인화에 사용됩니다. |
  | `account.save` | Guardar | Enregistrer | Salvar | Gem | 保存 | 저장 |
  | `account.saved` | Guardado | Enregistré | Salvo | Gemt | 保存しました | 저장됨 |
  | `account.signOut` | Cerrar sesión | Se déconnecter | Sair | Log ud | サインアウト | 로그아웃 |

- [ ] **Step 1.3: Run i18n consistency check.**

  Run: `pnpm i18n:check`
  Expected: PASS (all 7 locales have identical keyspace).

- [ ] **Step 1.4: Commit.**

  ```bash
  git add messages/
  git commit -m "feat(i18n): add magic-link auth + empty-state keys, prune password flow"
  ```

---

### Task 2: Create Supabase middleware session helper

**Files:**
- Create: `src/lib/supabase/middleware.ts`

- [ ] **Step 2.1: Write the helper.**

  ```typescript
  // src/lib/supabase/middleware.ts
  import { NextResponse, type NextRequest } from 'next/server';
  import { createServerClient } from '@supabase/ssr';
  import type { Database } from '@/types/database.types';

  /**
   * Refresh the Supabase auth cookie on each request. Must run before any
   * server code that calls `supabase.auth.getUser()` so the session is current.
   * Returns a NextResponse whose Set-Cookie headers must be merged with the
   * downstream response (next-intl) — see middleware.ts.
   */
  export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Trigger token refresh if needed.
    await supabase.auth.getUser();

    return response;
  }
  ```

- [ ] **Step 2.2: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS, no new errors.

---

### Task 3: Wire `updateSession` into root middleware (combined with next-intl)

**Files:**
- Modify: `middleware.ts`

- [ ] **Step 3.1: Replace `middleware.ts` content.**

  ```typescript
  // middleware.ts
  import createIntlMiddleware from 'next-intl/middleware';
  import type { NextRequest } from 'next/server';
  import { routing } from './src/i18n/routing';
  import { updateSession } from './src/lib/supabase/middleware';

  const intlMiddleware = createIntlMiddleware(routing);

  export default async function middleware(request: NextRequest) {
    // 1. Refresh Supabase session cookies first.
    const supabaseResponse = await updateSession(request);

    // 2. Run next-intl routing on the same request.
    const intlResponse = intlMiddleware(request);

    // 3. Merge Supabase Set-Cookie headers onto the next-intl response so
    //    refreshed auth cookies survive the locale rewrite/redirect.
    supabaseResponse.headers.getSetCookie().forEach((cookie) => {
      intlResponse.headers.append('set-cookie', cookie);
    });

    return intlResponse;
  }

  export const config = {
    // Match all pathnames except /api, /auth/callback (handler), /_next, /_vercel, static files.
    matcher: ['/((?!api|auth/callback|_next|_vercel|.*\\..*).*)'],
  };
  ```

  Note: `auth/callback` is excluded from the matcher because it's a route handler that needs to read raw query params and write its own redirect — running middleware on it adds no value and risks double-cookie writes.

- [ ] **Step 3.2: Typecheck + run dev server briefly to confirm no boot errors.**

  Run: `pnpm typecheck`
  Expected: PASS.

  (Skip dev server start in this step — Task 4 will run a full smoke before commit.)

---

### Task 4: Build `LoginForm` client component + Server Action

**Files:**
- Create: `src/app/[locale]/login/actions.ts`
- Create: `src/components/LoginForm.tsx`

- [ ] **Step 4.1: Write the Server Action.**

  ```typescript
  // src/app/[locale]/login/actions.ts
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
  ```

- [ ] **Step 4.2: Write the client form component.**

  ```typescript
  // src/components/LoginForm.tsx
  'use client';

  import { useState, useTransition } from 'react';
  import { useTranslations } from 'next-intl';
  import { signInWithMagicLink } from '@/app/[locale]/login/actions';

  export function LoginForm() {
    const t = useTranslations('auth');
    const [pending, startTransition] = useTransition();
    const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');

    function handleSubmit(formData: FormData) {
      startTransition(async () => {
        const result = await signInWithMagicLink(formData);
        setStatus(result.ok ? 'sent' : 'error');
      });
    }

    if (status === 'sent') {
      return (
        <p className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-sm">
          {t('checkInbox')}
        </p>
      );
    }

    return (
      <form action={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t('email')}
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-full bg-foreground px-4 py-2.5 font-medium text-white disabled:opacity-50"
        >
          {pending ? t('errorGeneric').slice(0, 0) || '…' : t('sendMagicLink')}
        </button>
        {status === 'error' && (
          <p className="text-sm text-red-600">{t('errorGeneric')}</p>
        )}
      </form>
    );
  }
  ```

- [ ] **Step 4.3: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS.

---

### Task 5: Rewrite `/login` page to use `LoginForm`

**Files:**
- Modify: `src/app/[locale]/login/page.tsx`

- [ ] **Step 5.1: Replace login page content.**

  ```typescript
  // src/app/[locale]/login/page.tsx
  import { setRequestLocale, getTranslations } from 'next-intl/server';
  import { redirect } from 'next/navigation';
  import { Header } from '@/components/Header';
  import { Footer } from '@/components/Footer';
  import { LoginForm } from '@/components/LoginForm';
  import { createClient } from '@/lib/supabase/server';

  type Props = { params: Promise<{ locale: string }> };

  export const dynamic = 'force-dynamic';

  export default async function LoginPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('auth');

    // If already signed in, send them home.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect('/');

    return (
      <>
        <Header user={null} />
        <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl">{t('loginTitle')}</h1>
            <p className="text-sm opacity-80">{t('loginSubtitle')}</p>
          </div>
          <LoginForm />
        </main>
        <Footer />
      </>
    );
  }
  ```

- [ ] **Step 5.2: Typecheck.** (Will fail until Header takes `user` prop in Task 7 — that's expected; mark this as a known-broken intermediate state. Do NOT commit yet.)

---

### Task 6: Create `/auth/callback` route handler

**Files:**
- Create: `src/app/auth/callback/route.ts`

- [ ] **Step 6.1: Write the callback handler.**

  ```typescript
  // src/app/auth/callback/route.ts
  import { NextResponse } from 'next/server';
  import { createClient } from '@/lib/supabase/server';

  export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') ?? '/';

    if (!code) {
      return NextResponse.redirect(new URL('/en/login?error=expired', url.origin));
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('exchangeCodeForSession failed', error);
      return NextResponse.redirect(new URL('/en/login?error=expired', url.origin));
    }

    return NextResponse.redirect(new URL(next, url.origin));
  }
  ```

  Note: redirecting to `/en/login` on error is a Stage A simplification — full locale-aware error redirect can come later. The home redirect (`next='/'`) lets `next-intl` middleware pick up the user's preferred locale.

- [ ] **Step 6.2: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS.

---

### Task 7: Update `Header` + `AccountMenu` + Layout to use real `user`

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/components/AccountMenu.tsx`
- Modify: `src/app/[locale]/layout.tsx`
- Delete: `src/app/[locale]/signup/page.tsx`

- [ ] **Step 7.1: Update `Header.tsx` to take a `user` prop.**

  ```typescript
  // src/components/Header.tsx
  import type { User } from '@supabase/supabase-js';
  import { Logo } from './Logo';
  import { LanguageSwitcher } from './LanguageSwitcher';
  import { AccountMenu } from './AccountMenu';

  type Props = {
    user: User | null;
  };

  export function Header({ user }: Props) {
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
  ```

- [ ] **Step 7.2: Update `AccountMenu.tsx` — single `Sign in` link, account+logout when authenticated.**

  ```typescript
  // src/components/AccountMenu.tsx
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
  ```

- [ ] **Step 7.3: Update layout to fetch user and pass to children.**

  Modify `src/app/[locale]/layout.tsx` — add `user` resolution but DO NOT render Header here (layout doesn't render Header today; pages do). The change is to expose user via prop drilling on pages. Since the existing layout only wraps children in `NextIntlClientProvider`, no change to the layout itself is needed for Stage A. Header is rendered per-page (`page.tsx`, `login/page.tsx`, `account/page.tsx`) and each page resolves user independently via `createClient().auth.getUser()`.

  **No edit to `layout.tsx` in this step.** (Documented to make non-action explicit.)

- [ ] **Step 7.4: Delete the signup page.**

  ```bash
  rm src/app/[locale]/signup/page.tsx
  ```

- [ ] **Step 7.5: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS (Header now matches login page's `<Header user={null} />`; account/actions.ts file is forward-referenced and will be created in Task 8 — typecheck will FAIL on AccountMenu's import. **Skip step 7.5 if needed** and proceed to Task 8 first; combined typecheck happens at end of Task 8.)

---

### Task 8: Build `/account` page + `signOut` Server Action

**Files:**
- Create: `src/app/[locale]/account/actions.ts`
- Create: `src/app/[locale]/account/page.tsx`

- [ ] **Step 8.1: Write the Server Actions.**

  ```typescript
  // src/app/[locale]/account/actions.ts
  'use server';

  import { redirect } from 'next/navigation';
  import { createClient } from '@/lib/supabase/server';

  export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  }

  export async function updateHomeCity(formData: FormData) {
    const slug = String(formData.get('citySlug') ?? '').trim();
    if (!slug) return;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login');

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
  ```

- [ ] **Step 8.2: Write the account page.**

  ```typescript
  // src/app/[locale]/account/page.tsx
  import { setRequestLocale, getTranslations } from 'next-intl/server';
  import { redirect } from 'next/navigation';
  import { Header } from '@/components/Header';
  import { Footer } from '@/components/Footer';
  import { CITIES } from '@/lib/i18n/cities';
  import { createClient } from '@/lib/supabase/server';
  import { signOut, updateHomeCity } from './actions';

  type Props = { params: Promise<{ locale: string }> };

  export const dynamic = 'force-dynamic';

  export default async function AccountPage({ params }: Props) {
    const { locale } = await params;
    setRequestLocale(locale);
    const t = await getTranslations('account');
    const tc = await getTranslations('cities');

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) redirect('/login?next=/account');

    const { data: profile } = await supabase
      .from('users')
      .select('home_city_id, cities:home_city_id(slug)')
      .eq('id', user.id)
      .single();

    const currentSlug =
      (profile?.cities as { slug: string } | null)?.slug ?? '';

    return (
      <>
        <Header user={user} />
        <main className="mx-auto flex max-w-md flex-col gap-8 px-4 py-16">
          <div className="space-y-1">
            <h1 className="font-serif text-4xl">{t('title')}</h1>
            <p className="text-sm opacity-80">{user.email}</p>
          </div>

          <form action={updateHomeCity} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
              {t('homeCity')}
              <select
                name="citySlug"
                defaultValue={currentSlug}
                className="rounded-2xl border border-pink-200 bg-white px-4 py-2"
              >
                <option value="" disabled>
                  —
                </option>
                {CITIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {tc(c.slug as 'tokyo')}
                  </option>
                ))}
              </select>
              <span className="text-xs opacity-60">{t('homeCityHint')}</span>
            </label>
            <button
              type="submit"
              className="self-start rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white"
            >
              {t('save')}
            </button>
          </form>

          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full border border-pink-200 bg-white px-4 py-2 text-sm font-medium hover:bg-pink-50"
            >
              {t('signOut')}
            </button>
          </form>
        </main>
        <Footer />
      </>
    );
  }
  ```

- [ ] **Step 8.3: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS — all auth-flow files now consistent.

---

### Task 9: Create `getHomeFeed` query

**Files:**
- Create: `src/lib/feed/queries.ts`
- Create: `tests/unit/feed/queries.test.ts`

- [ ] **Step 9.1: Write the failing test.**

  ```typescript
  // tests/unit/feed/queries.test.ts
  import { describe, it, expect, vi } from 'vitest';
  import { getHomeFeed } from '@/lib/feed/queries';

  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(async () => ({
      rpc: vi.fn(async (name: string) => {
        if (name === 'ranked_pieces') {
          return {
            data: [
              { id: 'r1', upvotes: 10, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
              { id: 'r2', upvotes: 5, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
              { id: 'r3', upvotes: 3, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
              { id: 'r4', upvotes: 2, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
              { id: 'r5', upvotes: 1, downvotes: 0, approved_at: '2026-04-25T00:00:00Z', city_id: 'c1' },
            ],
            error: null,
          };
        }
        if (name === 'fresh_pieces') {
          return {
            data: [
              { id: 'f1', upvotes: 0, downvotes: 0, approved_at: '2026-04-26T00:00:00Z', city_id: 'c1' },
            ],
            error: null,
          };
        }
        return { data: [], error: null };
      }),
    })),
  }));

  describe('getHomeFeed', () => {
    it('interleaves fresh into ranked pieces every 5 positions', async () => {
      const items = await getHomeFeed({ citySlug: 'bogota', kind: 'pieces', limit: 5 });
      expect(items).toHaveLength(5);
      expect(items[4].id).toBe('f1');
    });

    it('returns empty array when both rpcs return empty', async () => {
      const { createClient } = await import('@/lib/supabase/server');
      vi.mocked(createClient).mockResolvedValueOnce({
        // @ts-expect-error partial mock
        rpc: vi.fn(async () => ({ data: [], error: null })),
      });
      const items = await getHomeFeed({ citySlug: 'bogota', kind: 'pieces', limit: 5 });
      expect(items).toEqual([]);
    });
  });
  ```

- [ ] **Step 9.2: Run the test to confirm it fails.**

  Run: `pnpm test tests/unit/feed/queries.test.ts`
  Expected: FAIL with "Cannot find module '@/lib/feed/queries'".

- [ ] **Step 9.3: Write the implementation.**

  ```typescript
  // src/lib/feed/queries.ts
  import { createClient } from '@/lib/supabase/server';
  import {
    interleaveFresh,
    FRESH_SLOT_EVERY,
    type RankableItem,
  } from './ranking';
  import type { Database } from '@/types/database.types';

  type PieceRow = Database['public']['Tables']['pieces']['Row'];
  type OutfitRow = Database['public']['Tables']['outfits']['Row'];

  export type FeedItem = (PieceRow | OutfitRow) & RankableItem;

  type Args = {
    citySlug: string;
    kind: 'pieces' | 'outfits';
    limit?: number;
  };

  /**
   * Fetch ranked + fresh items via Supabase RPCs and interleave them.
   * Pass `citySlug: 'global'` for the cross-city feed (sent as null to RPC).
   */
  export async function getHomeFeed({
    citySlug,
    kind,
    limit = 24,
  }: Args): Promise<FeedItem[]> {
    const supabase = await createClient();
    const slugArg = citySlug === 'global' ? null : citySlug;

    const rankedFn = kind === 'pieces' ? 'ranked_pieces' : 'ranked_outfits';
    const freshFn = kind === 'pieces' ? 'fresh_pieces' : 'fresh_outfits';

    const [rankedRes, freshRes] = await Promise.all([
      supabase.rpc(rankedFn, { p_city_slug: slugArg, p_limit: limit }),
      supabase.rpc(freshFn, {
        p_city_slug: slugArg,
        p_limit: Math.ceil(limit / FRESH_SLOT_EVERY),
      }),
    ]);

    const ranked = (rankedRes.data ?? []).map(toRankable);
    const fresh = (freshRes.data ?? []).map(toRankable);

    return interleaveFresh(ranked, fresh, limit, FRESH_SLOT_EVERY) as FeedItem[];
  }

  function toRankable<T extends PieceRow | OutfitRow>(row: T): T & RankableItem {
    return {
      ...row,
      cityId: row.city_id,
      approvedAt: row.approved_at ?? row.created_at,
    } as T & RankableItem;
  }
  ```

- [ ] **Step 9.4: Run the test to confirm it passes.**

  Run: `pnpm test tests/unit/feed/queries.test.ts`
  Expected: PASS, both tests green.

---

### Task 10: Update `EmptyState` + `FeedSection` to take props

**Files:**
- Modify: `src/components/EmptyState.tsx`
- Modify: `src/components/FeedSection.tsx`

- [ ] **Step 10.1: Update `EmptyState` to take `kind` + `cityName`.**

  ```typescript
  // src/components/EmptyState.tsx
  import { useTranslations } from 'next-intl';

  type Props = {
    kind: 'pieces' | 'outfits';
    cityName: string;
  };

  export function EmptyState({ kind, cityName }: Props) {
    const t = useTranslations('home.emptyState');
    const titleKey = kind === 'pieces' ? 'piecesTitle' : 'outfitsTitle';
    return (
      <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/40 p-12 text-center">
        <div
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              'radial-gradient(circle, #f9a8d4 1.5px, transparent 1.5px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <p className="relative font-serif text-lg italic text-pink-900">
          {t(titleKey, { city: cityName })}
        </p>
        <p className="relative mt-2 text-sm font-medium text-pink-900">
          {t('cta')}
        </p>
      </div>
    );
  }
  ```

- [ ] **Step 10.2: Update `FeedSection` to pass `kind` + `cityName` down + accept already-resolved items.**

  ```typescript
  // src/components/FeedSection.tsx
  'use client';

  import { useState } from 'react';
  import { useTranslations } from 'next-intl';
  import { Plus } from 'lucide-react';
  import { Link } from '@/i18n/navigation';
  import { CitySelector } from './CitySelector';
  import { PieceCard, type PieceCardData } from './PieceCard';
  import { OutfitCard, type OutfitCardData } from './OutfitCard';
  import { EmptyState } from './EmptyState';

  type Props =
    | {
        kind: 'pieces';
        defaultCity: string;
        items: PieceCardData[];
      }
    | {
        kind: 'outfits';
        defaultCity: string;
        items: OutfitCardData[];
      };

  export function FeedSection(props: Props) {
    const t = useTranslations('home');
    const tc = useTranslations('cities');
    const [city, setCity] = useState(props.defaultCity);

    const title =
      props.kind === 'pieces' ? t('trendingPieces') : t('trendingOutfits');
    const shareLabel =
      props.kind === 'pieces' ? t('sharePiece') : t('shareOutfit');
    const shareHref =
      props.kind === 'pieces' ? '/submit/piece' : '/submit/outfit';

    const cityName = city === 'global' ? 'global' : tc(city as 'tokyo');

    return (
      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-serif text-3xl tracking-tight">{title}</h2>
          <div className="flex items-center gap-2">
            <CitySelector value={city} onChange={setCity} />
            <Link
              href={shareHref}
              className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1.5 text-sm font-medium text-white hover:bg-foreground/80"
            >
              <Plus className="size-4" />
              {shareLabel}
            </Link>
          </div>
        </div>

        {props.items.length === 0 ? (
          <EmptyState kind={props.kind} cityName={cityName} />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {props.kind === 'pieces'
              ? props.items.map((p) => <PieceCard key={p.id} piece={p} />)
              : props.items.map((o) => <OutfitCard key={o.id} outfit={o} />)}
          </div>
        )}
      </section>
    );
  }
  ```

  Note: `FeedSection` still uses local `city` state for the dropdown UX. Stage A leaves the `items` prop driven by the server-side `defaultCity`; switching cities client-side won't refetch (deferred to Stage B). The dropdown still persists to localStorage so the user's choice survives reloads.

- [ ] **Step 10.3: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS.

---

### Task 11: Replace stub data on home page

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Delete: `src/lib/feed/stub-data.ts`

- [ ] **Step 11.1: Update home page to use `getHomeFeed`.**

  ```typescript
  // src/app/[locale]/page.tsx
  import { setRequestLocale } from 'next-intl/server';
  import { Header } from '@/components/Header';
  import { Footer } from '@/components/Footer';
  import { FeedSection } from '@/components/FeedSection';
  import { NewsletterBanner } from '@/components/NewsletterBanner';
  import { createClient } from '@/lib/supabase/server';
  import { getHomeFeed } from '@/lib/feed/queries';
  import type { PieceCardData } from '@/components/PieceCard';
  import type { OutfitCardData } from '@/components/OutfitCard';

  type Props = {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ city?: string }>;
  };

  export const dynamic = 'force-dynamic';

  export default async function HomePage({ params, searchParams }: Props) {
    const { locale } = await params;
    const { city } = await searchParams;
    setRequestLocale(locale);

    const citySlug = city ?? 'global';

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const [pieces, outfits] = await Promise.all([
      getHomeFeed({ citySlug, kind: 'pieces', limit: 24 }),
      getHomeFeed({ citySlug, kind: 'outfits', limit: 12 }),
    ]);

    return (
      <>
        <Header user={user} />
        <main className="mx-auto max-w-7xl space-y-12 px-4 py-8">
          <FeedSection
            kind="pieces"
            defaultCity={citySlug}
            items={pieces as unknown as PieceCardData[]}
          />
          <FeedSection
            kind="outfits"
            defaultCity={citySlug}
            items={outfits as unknown as OutfitCardData[]}
          />
        </main>
        <NewsletterBanner />
        <Footer />
      </>
    );
  }
  ```

  Note on the cast: `getHomeFeed` returns DB rows; `PieceCardData` / `OutfitCardData` are presentation types defined in their respective card components. Stage A relies on the runtime fact that empty data is the only path that ships in this PR (the DB is empty in prod). When DB rows exist (Phase 3+), we'll add a mapping function. Casting through `unknown` is intentional and surfaces in code review.

- [ ] **Step 11.2: Delete the stub data module.**

  ```bash
  rm src/lib/feed/stub-data.ts
  ```

- [ ] **Step 11.3: Verify nothing else imports stub-data.**

  Run: `grep -r "stub-data" src/ messages/ tests/ || echo "no references"`
  Expected: `no references` printed.

- [ ] **Step 11.4: Remove deprecated stub-data i18n entries.**

  In each of `messages/{en,es,fr,pt,da,ja,ko}.json`, remove the entire `stubData` block. After: run `pnpm i18n:check`.
  Expected: PASS.

- [ ] **Step 11.5: Typecheck.**

  Run: `pnpm typecheck`
  Expected: PASS.

---

### Task 12: Update / add e2e tests

**Files:**
- Modify: `tests/e2e/home.smoke.spec.ts`
- Create: `tests/e2e/login-magic-link.spec.ts`
- Create: `tests/e2e/account-protected.spec.ts`

- [ ] **Step 12.1: Update `home.smoke.spec.ts`.** Replace the existing file with assertions matching the new (empty-DB) reality:

  ```typescript
  // tests/e2e/home.smoke.spec.ts
  import { test, expect } from '@playwright/test';

  test.describe('home @smoke', () => {
    test('renders trending pieces and outfits sections in English', async ({ page }) => {
      await page.goto('/en');
      await expect(page.getByRole('heading', { name: 'Trending pieces' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Trending outfits' })).toBeVisible();
    });

    test('shows empty state copy when DB has no items', async ({ page }) => {
      await page.goto('/en');
      // City defaults to 'global' → copy is "No trending pieces in global yet"
      await expect(page.getByText(/No trending pieces in/i)).toBeVisible();
      await expect(page.getByText(/No trending outfits in/i)).toBeVisible();
    });

    test('language switcher updates the URL locale', async ({ page }) => {
      await page.goto('/en');
      await page.getByLabel('Language').selectOption('es');
      await expect(page).toHaveURL(/\/es/);
    });

    test('legal pages respond with 200', async ({ page }) => {
      const privacy = await page.goto('/en/privacy');
      expect(privacy?.status()).toBe(200);
      const terms = await page.goto('/en/terms');
      expect(terms?.status()).toBe(200);
    });

    test('header shows Sign in link when anonymous', async ({ page }) => {
      await page.goto('/en');
      await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();
    });
  });
  ```

- [ ] **Step 12.2: Add `login-magic-link.spec.ts`** (form smoke only — full email-flow e2e deferred):

  ```typescript
  // tests/e2e/login-magic-link.spec.ts
  import { test, expect } from '@playwright/test';

  test('login page shows magic-link form', async ({ page }) => {
    await page.goto('/en/login');
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Send magic link' })).toBeVisible();
  });

  test('signup page no longer exists (404)', async ({ page }) => {
    const response = await page.goto('/en/signup');
    expect(response?.status()).toBe(404);
  });
  ```

- [ ] **Step 12.3: Add `account-protected.spec.ts`.**

  ```typescript
  // tests/e2e/account-protected.spec.ts
  import { test, expect } from '@playwright/test';

  test('anonymous user visiting /account is redirected to /login', async ({ page }) => {
    await page.goto('/en/account');
    await expect(page).toHaveURL(/\/login/);
  });
  ```

- [ ] **Step 12.4: Run e2e tests locally.** Skip locally if it requires running dev server — the CI pipeline will run them on PR. For Stage A, just verify the unit tests pass:

  Run: `pnpm test`
  Expected: PASS (all unit tests including the new `queries.test.ts`).

---

### Task 13: Final verification, commit, deploy

- [ ] **Step 13.1: Run full verification gauntlet.**

  ```bash
  pnpm typecheck
  pnpm lint
  pnpm i18n:check
  pnpm test
  ```

  Expected: all four PASS.

- [ ] **Step 13.2: Run dev server smoke once.**

  ```bash
  pnpm dev
  ```

  In another shell: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en`
  Expected: `200`.

  Then: `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en/login`
  Expected: `200`.

  Then: `curl -s -L -o /dev/null -w "%{http_code} %{url_effective}\n" http://localhost:3000/en/account`
  Expected: ends with `/en/login...` (redirect followed).

  Stop dev server.

- [ ] **Step 13.3: Stage and commit.**

  ```bash
  git add messages/ middleware.ts src/ tests/ docs/superpowers/plans/
  git status   # verify only intended files
  git commit -m "$(cat <<'EOF'
  feat(phase-2): wire magic-link auth and replace stubs with real Supabase queries

  - Add updateSession middleware helper and combine with next-intl routing
  - Replace /login with magic-link Server Action; add /auth/callback handler
  - Delete /signup (magic link auto-creates accounts on first use)
  - Add protected /account page with home_city dropdown + sign-out
  - Replace stub-data.ts with getHomeFeed() wrapping ranked_/fresh_ RPCs
  - Update EmptyState to take kind+cityName props and use new i18n keys
  - Update Header/AccountMenu to use real Supabase user object
  - Add unit tests for getHomeFeed; e2e tests for login form, account redirect, empty state
  - Translate new auth+empty-state keys across all 7 locales; prune deprecated password-flow keys

  Manual setup still required (one-time):
  - Supabase Dashboard → Auth → URL Configuration: add /auth/callback to allowed
    redirect URLs for both dev and prod projects.

  Closes Phase 2 Stage A. Google OAuth and geo-detection remain Stage B.

  Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
  EOF
  )"
  ```

- [ ] **Step 13.4: Push to org repo.**

  ```bash
  git push origin main
  ```

  This triggers the `sync-mirror.yml` GitHub Action, which pushes to `octavioecheverri/trendpulse`, which Vercel auto-deploys.

- [ ] **Step 13.5: Watch the deploy.**

  ```bash
  gh run list --workflow=sync-mirror.yml --limit 1
  ```

  Expected: most recent run shows `completed success`. Then check Vercel dashboard or visit `https://trendpul.se` once Vercel finishes — empty state should be visible on the home page.

---

## Stage B (deferred — separate plan)

Open a follow-up plan for these once Stage A is live:

1. **Geo-detection `/api/geo` route** — Vercel `geolocation()` → `nearestCity` helper → city slug. Replaces the `'global'` default on the home page. ~3 tasks.
2. **Google OAuth** — Cloud Console + Supabase provider setup → "Continue with Google" button on `LoginForm`. ~2 tasks plus user-side external setup.
3. **Map DB rows → card props** — proper mapping function so `pieces` / `outfits` rows render correctly in `PieceCard` / `OutfitCard`. Touches Phase 3 territory; bundle with submit/voting work.
4. **Client-side feed refetch on city change** — switch from server-only `defaultCity` to a client query that re-fetches when the dropdown changes.

---

## Self-review (executed)

**Spec coverage:**
- ✅ Magic link auth (Tasks 4-6)
- ❌ Google OAuth — explicitly deferred (Stage B), in line with spec's risk mitigation
- ✅ `/account` with email + home_city + logout (Task 8)
- ✅ Real-data home (Tasks 9-11)
- ✅ Empty state with i18n (Task 10, 1)
- ❌ Geo-detection — deferred (Stage B); spec acknowledges fallback to `'global'` is acceptable in dev
- ✅ Middleware updateSession (Tasks 2-3)
- ✅ Tests: unit for queries, e2e for login form + protected route + empty state
- ✅ Acceptance: typecheck/lint/i18n:check/test gates (Task 13.1)

**Placeholder scan:** none. All file paths and code blocks are concrete.

**Type consistency:** `getHomeFeed` returns `FeedItem[]`; `Header` takes `user: User | null`; `AccountMenu` takes `user: User | null` matching. `EmptyState` takes `{ kind, cityName }` matching `FeedSection`'s call. `signOut` and `updateHomeCity` are exported from `account/actions.ts` and imported in `AccountMenu` and `account/page.tsx` respectively. Consistent.

**Known compromise:** `PieceCardData` / `OutfitCardData` cast (Task 11.1) is documented and intentional — empty-DB ships in this PR so the cast is dead code at runtime. A proper mapper lands with Phase 3 (submit/vote).
