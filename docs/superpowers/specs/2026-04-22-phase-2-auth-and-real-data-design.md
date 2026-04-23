# Phase 2 — Auth + Real Data — Design Spec

**Date:** 2026-04-22
**Author:** Octavio E. (with Claude)
**Status:** Approved, ready for implementation planning
**Supersedes:** Phase 2 section of `/Users/octavioecheverri/.claude/plans/mellow-twirling-robin.md`

## Context

TrendPulse is a community-powered fashion trend analytics platform deployed at `trendpul.se`. Phase 1 (scaffold + CI/CD + domain + i18n stubs + stub data rendering) is complete. This spec defines Phase 2: wiring real authentication and replacing stub data with real queries against Supabase.

As of this writing:
- Production Supabase project (`awofarhubyvdolipvyap`) has three migrations applied (tables, RLS, RPC functions for voting and ranking).
- `trendpul.se` serves the home page with `STUB_PIECES` / `STUB_OUTFITS` from `src/lib/feed/stub-data.ts`.
- `SUPABASE_SERVICE_ROLE_KEY` is in Vercel production, flagged `sensitive`, recently rotated after the April 2026 Vercel security incident.
- i18n has 7 locales with full translations (commit `1f66276`).

## Brainstorming decisions

| Decision | Choice |
|---|---|
| Auth methods | Magic link (passwordless) + Google OAuth |
| Empty DB strategy | Show empty states with polka dot SVG; no seed in this phase (seed deferred to Phase 4 per master plan) |
| Account page scope | Minimal — home_city dropdown + logout. Delete account and handle editing deferred to Phase 6 |
| Auth integration pattern | Full Supabase SSR with `@supabase/ssr` (official pattern for Next.js App Router) |

## Out of scope

Explicitly NOT built in Phase 2:
- Submit piece/outfit (Phase 3)
- Voting (Phase 3)
- Admin moderation (Phase 4)
- Delete account / GDPR flow (Phase 6)
- Avatar upload (Phase 3, bundled with Supabase Storage setup)
- My submissions page (Phase 3, when there is content to show)
- Handle editing (Phase 6)
- PostHog / Sentry instrumentation (Phase 7)
- Initial seed of 50 trends (Phase 4)

## Architecture

### Dependencies to install

- `@supabase/ssr` — official SSR helper with cookie-based auth
- `@supabase/supabase-js` — base SDK (transitive)
- `@vercel/functions` — for `geolocation()` helper in `/api/geo`

### Supabase client split

| File | Context | Auth source |
|---|---|---|
| `src/lib/supabase/client.ts` | Client components | Browser cookies |
| `src/lib/supabase/server.ts` | Server components + Server Actions | `cookies()` API |
| `src/lib/supabase/middleware.ts` | `middleware.ts` only | Reads + refreshes session cookies |
| `src/lib/supabase/admin.ts` | Routes that bypass RLS (not used in Phase 2, but kept ready) | `service_role` key |

The first three follow the pattern documented at https://supabase.com/docs/guides/auth/server-side/nextjs.

### File changes

**New files:**

```
src/
├── app/
│   ├── [locale]/
│   │   └── account/page.tsx              # server component: email + home_city + logout
│   ├── auth/callback/route.ts            # exchanges ?code for session, sets cookies, redirects
│   └── api/geo/route.ts                  # Vercel geolocation() → city slug
├── lib/
│   ├── supabase/middleware.ts            # updateSession() helper
│   └── feed/queries.ts                   # wraps ranked_pieces() + fresh_pieces() RPCs
└── components/
    └── AuthForm.tsx                      # reusable form: email input + Google button
```

**Modified files:**

| File | Change |
|---|---|
| `middleware.ts` | Call `updateSession(request)` before `next-intl` routing handler |
| `src/app/[locale]/page.tsx` | Replace `stub-data` import with `getHomeFeed({ citySlug, kind })` |
| `src/components/FeedSection.tsx` | Accept `data` prop from parent instead of importing stub |
| `src/components/AccountMenu.tsx` | Branch on `user` prop: logged-in shows handle + logout link; logged-out shows "Sign in" link |
| `src/app/[locale]/layout.tsx` | Resolve `user` from server and pass to `Header` → `AccountMenu` |

**Deleted files:**

| File | Reason |
|---|---|
| `src/app/[locale]/signup/page.tsx` | Magic link makes first use = account creation automatically; single `/login` route |
| `src/lib/feed/stub-data.ts` | Replaced by `queries.ts`; no longer imported anywhere |

### Structural decision: one `/login` route, no `/signup`

With magic link, the first email address to be used auto-creates a Supabase Auth user. Having a separate `/signup` page adds navigation complexity without user benefit. Copy on `/login` uses dual-intent language ("Sign in or sign up"), and Google OAuth handles both flows identically.

## Auth flow

### Magic link

```
User on /login
  → types email
  → Server Action calls supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: 'https://trendpul.se/auth/callback' }
    })
  → UI shows "Check your inbox"
  → user clicks link in email
  → GET /auth/callback?code=XXX
  → route handler calls supabase.auth.exchangeCodeForSession(code)
  → session cookies set on response
  → redirect to ?next URL or '/'
```

### Google OAuth

```
User clicks "Continue with Google"
  → Client calls supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: 'https://trendpul.se/auth/callback' }
    })
  → Supabase redirects → Google consent screen
  → Google redirects → /auth/callback?code=XXX
  → same handler as magic link flow
```

**External setup required (user action):**

1. Google Cloud Console → APIs & Services → Credentials → Create OAuth 2.0 Client ID
2. Application type: Web application
3. Authorized redirect URI: `https://awofarhubyvdolipvyap.supabase.co/auth/v1/callback`
4. Copy Client ID + Client Secret
5. Supabase Dashboard → Authentication → Providers → Google → paste credentials → Enable

### Protected route pattern

```typescript
// src/app/[locale]/account/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/account')
  // render user.email, home_city select, logout button
}
```

### Session refresh (middleware)

The existing `middleware.ts` already handles i18n routing. The Phase 2 change is to call `updateSession(request)` first:

```typescript
// middleware.ts (pseudocode — exact API depends on next-intl version)
import { updateSession } from '@/lib/supabase/middleware'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'

const intl = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  const supabaseResponse = await updateSession(request)
  // Run intl over the Supabase-aware response so refreshed cookies survive
  const intlResponse = intl(request)
  // Merge: preserve Set-Cookie headers from supabaseResponse onto intlResponse
  supabaseResponse.headers.getSetCookie().forEach(c => intlResponse.headers.append('set-cookie', c))
  return intlResponse
}
```

The exact merge strategy will be verified against current `next-intl` + `@supabase/ssr` versions during implementation — the contract is: cookies refreshed by Supabase must survive whatever response i18n returns.

`updateSession()`:
1. Reads `sb-<project>-auth-token` cookies
2. If JWT expired but refresh token is valid, renews silently
3. Sets new cookies on the response

### Logout

Server Action invoked from `AccountMenu` or `/account`:

```typescript
'use server'
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
```

### Edge cases

| Case | Behavior |
|---|---|
| Expired magic link (>1h) | `/auth/callback` detects error → redirect to `/login?error=expired` with toast |
| Already-consumed magic link | Same redirect with error message |
| User closes tab before clicking link | No effect; link remains valid for 1h in inbox |
| Authenticated user opens `/login` | Middleware redirects to `/` |
| Corrupted cookies | `getUser()` returns `null` → treated as logged out |

## Home + real data + geo

### Queries (`src/lib/feed/queries.ts`)

Wraps the RPCs defined in `supabase/migrations/0003_functions.sql`:

```typescript
import { createClient } from '@/lib/supabase/server'
import { interleaveFresh } from './ranking'

export async function getHomeFeed({
  citySlug,
  kind,
  limit = 20,
}: { citySlug: string; kind: 'pieces' | 'outfits'; limit?: number }) {
  const supabase = await createClient()

  const { data: city } = await supabase
    .from('cities').select('id').eq('slug', citySlug).single()
  if (!city) return []

  const [{ data: hot }, { data: fresh }] = await Promise.all([
    supabase.rpc('ranked_pieces', { city_id_in: city.id, kind_in: kind, limit_in: limit }),
    supabase.rpc('fresh_pieces', { city_id_in: city.id, kind_in: kind, limit_in: Math.ceil(limit / 5) }),
  ])

  return interleaveFresh(hot ?? [], fresh ?? [], { every: 5 })
}
```

The `interleaveFresh` function already exists in `src/lib/feed/ranking.ts` (created in Phase 1).

### Geo route (`src/app/api/geo/route.ts`)

```typescript
import { geolocation } from '@vercel/functions'
import { nearestCity } from '@/lib/i18n/cities'

export async function GET(request: Request) {
  const geo = geolocation(request)
  const match = nearestCity(geo)
  return Response.json({ citySlug: match?.slug ?? 'global' })
}
```

`nearestCity` is a new export in `src/lib/i18n/cities.ts` that compares the incoming `{ latitude, longitude, country }` against the 13 preconfigured cities. If the country matches a city's country code, that city wins. Otherwise, compute great-circle distance to each and return the closest within 500 km, or `null` if none.

### Default city resolution

Priority (highest first):

1. `localStorage.trendpulse_city` — user's manual override
2. `fetch('/api/geo')` — IP-based detection
3. `'global'` — fallback to cross-city feed

The server component of the home page receives `citySlug` via the URL search param (`?city=bogota`); if absent, renders with `'global'` for SEO correctness. On hydration, the `CitySelector` checks localStorage + geo and re-navigates if the detected city differs from the rendered one.

### Empty state UX

When `getHomeFeed()` returns `[]`, `FeedSection` renders `<EmptyState />`:
- Polka dot SVG background pattern (pastel y2k accent per project aesthetic)
- i18n copy: `home.emptyState.{pieces|outfits}.title` with interpolated city name
- CTA: `home.emptyState.{pieces|outfits}.cta` → link to `/login?next=/` (until Phase 3 wires `/submit/piece`)

### New i18n keys

Added to `messages/en.json` and propagated to the 6 other locales via `pnpm translate`:

```json
{
  "auth.login.emailLabel": "Email",
  "auth.login.sendMagicLink": "Send magic link",
  "auth.login.continueWithGoogle": "Continue with Google",
  "auth.login.checkInbox": "Check your inbox for the sign-in link.",
  "auth.login.errorExpired": "This link has expired. Please request a new one.",
  "auth.account.title": "Your account",
  "auth.account.homeCity": "Home city",
  "auth.account.signOut": "Sign out",
  "home.emptyState.pieces.title": "No trending pieces in {city} yet",
  "home.emptyState.pieces.cta": "Be the first to share",
  "home.emptyState.outfits.title": "No trending outfits in {city} yet",
  "home.emptyState.outfits.cta": "Be the first to share"
}
```

## Testing

### Unit tests (Vitest)

| File | Coverage |
|---|---|
| `tests/unit/supabase/middleware.test.ts` | `updateSession` renews expired JWT, preserves cookies across the response |
| `tests/unit/feed/queries.test.ts` | `getHomeFeed` resolves slug → id, correctly interleaves hot + fresh results (Supabase RPC mocked) |
| `tests/unit/i18n/geo.test.ts` | `nearestCity` returns correct slug for coords matching each of the 13 cities; returns `null` for mid-ocean coords |

### E2E tests (Playwright)

| File | Coverage |
|---|---|
| `tests/e2e/auth-magic-link.spec.ts` | `/login` → submit test email → in CI, use `supabase.auth.admin.generateLink()` with the service-role client to retrieve the magic link URL without depending on actual email delivery → follow link → verify `/account` accessible |
| `tests/e2e/auth-google.spec.ts` | Skipped in CI; runs locally with `E2E_GOOGLE_EMAIL` + `E2E_GOOGLE_PASSWORD` |
| `tests/e2e/home-empty-state.spec.ts` | Visit `/` against empty DB → assert `<EmptyState />` visible with correct i18n copy |
| `tests/e2e/geo-default-city.spec.ts` | Set `x-vercel-ip-country=CO` header on request → GET `/api/geo` → response `{ citySlug: 'bogota' }` |
| `tests/e2e/account-protected.spec.ts` | Visit `/account` without session cookie → assert redirect to `/login?next=/account` |

### Acceptance criteria — "Phase 2 done"

- [ ] `trendpul.se/login` sends a working magic link to any email address
- [ ] Clicking magic link establishes session and redirects to `/` (or `?next=` target)
- [ ] `trendpul.se/login` "Continue with Google" button completes OAuth and establishes session
- [ ] Header shows handle + logout menu when authenticated; "Sign in" link when not
- [ ] `/account` is inaccessible without session (redirect to `/login?next=/account`)
- [ ] `/account` displays email, allows changing home city, logs out
- [ ] Home (`/`) queries Supabase in real time; empty DB renders EmptyState in all 7 locales
- [ ] `/api/geo` returns a valid city slug from Vercel geolocation headers
- [ ] `CitySelector` respects geo on first visit, persists override to `localStorage`
- [ ] All unit + e2e tests pass
- [ ] `pnpm typecheck` + `pnpm lint` + `pnpm i18n:check` all pass
- [ ] Deploy to production completes without runtime errors in Vercel logs
- [ ] Lighthouse performance score ≥ 80 on home page

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Supabase default email sender has low rate limits | Phase 2 traffic is <100 signups; if sustained >3/h, migrate to Resend (deferred to Phase 7) |
| Google OAuth external setup may block progress | Ship magic link first in isolation; add Google in a follow-up commit if the Cloud Console setup stalls |
| `@vercel/functions` `geolocation()` only works in edge/Fluid runtime, not local dev | In dev, `geo` falls back to `'global'` if headers are absent |
| Next.js 16 caching may misbehave with SSR cookies | Mark `/account` and any route reading cookies with `export const dynamic = 'force-dynamic'` |
| Loss of i18n coverage after adding new keys | `pnpm i18n:check` already gates CI; new keys must ship with all 7 translations |

## Success metric

One external friend (not Octavio) can:
1. Visit `trendpul.se`
2. Click "Sign in"
3. Receive and click the magic link on their own email
4. Land on `/account` and set their home city
5. Return to home and see (empty) feed per their home city — without encountering any broken state

## Next step

Invoke `superpowers:writing-plans` skill to generate the implementation plan from this spec.
