# TrendPulse — Setup Guide

## What's already done

- **Repo:** https://github.com/TrendPul-se/trendpulse (2 commits on `main`)
- **Domain:** `trendpul.se` (purchased on GoDaddy)
- **Stack:** Next.js 16 + TypeScript + Tailwind v4 + next-intl + Supabase + Vercel
- **Local verified:** `pnpm build`, `pnpm test` (7/7), `pnpm lint`, `pnpm typecheck`, `pnpm i18n:check` — all passing
- **Home page** rendered with stub data: Header (logo + language switcher + account menu), Trending Pieces section, Trending Outfits section, Newsletter banner, Footer
- **i18n:** 7 locales (en/es/fr/ja/ko/pt/da), 135 keys each. Non-English files are copies of en.json — need DeepL key to translate
- **13 cities** preconfigured: Tokyo, London, New York, Paris, Lagos, Copenhagen, Seoul, Mexico City, Madrid, Bogotá, Santiago, São Paulo, Lisbon
- **Supabase migrations:** 3 files ready (tables + RLS + seed cities + RPC functions for voting + ranking)
- **CI/CD:** 3 GitHub Actions workflows (`build-test`, `deploy`, `test-deploy`) with 2-environment model (dev + production)
- **Pages created:** `/` (home), `/login`, `/signup`, `/privacy`, `/terms`
- **Feed algorithm:** Hot decay (HN-style) + fresh slot injection, tested
- **Scripts:** `scripts/translate.ts` (DeepL batch), `scripts/check-i18n.ts` (CI key sync gate)

## Architecture decisions

| Area | Decision |
|---|---|
| Stack | Next.js 16 App Router + TypeScript + Tailwind v4 + shadcn/ui |
| Backend | Supabase (Postgres + Auth + Storage + RLS) |
| Deploy | Vercel (free tier), domain `trendpul.se` |
| i18n | `next-intl` + JSON files in `/messages/` + DeepL auto-translate |
| Auth | Email+password + Google OAuth (Supabase Auth) |
| Media | Photo (Supabase Storage) or embed IG/TikTok |
| Feed algo | Hot decay HN-style + fresh slot injection every 5 positions |
| Moderation | Manual queue in `/admin` (admin approves before publish) |
| Analytics | PostHog + Vercel Analytics + Sentry |
| Monetization day 1 | Affiliate links on pieces + Beehiiv newsletter (external link) + Premium waitlist |
| Aesthetic | Soft pastel + rounded (Depop/Pinterest vibe) + polka dot accents in empty/loading states |
| Legal | Cookie consent (GDPR/LGPD) + Privacy + Terms + Age gate 13+ + Delete account |
| CI/CD | 2 environments (dev + production) due to Supabase free tier limit of 2 projects |

## Data model (key entities)

- **cities** — 13 preconfigured with i18n names, official languages, coords
- **users** — extends auth.users, has handle, home_city, trust_score, role (user/moderator/admin)
- **pieces** — individual garments: photo or IG/TikTok embed, category (top/bottom/dress/outerwear/shoes/bag/accessory/jewelry/headwear), city, votes, status (pending/approved/rejected), optional affiliate URL
- **outfits** — combinations of pieces: photo + optional tags to existing pieces, city, votes, status
- **votes** — user votes on pieces or outfits (+1/-1), atomic upsert via RPC
- **premium_waitlist** — users interested in premium tier

## Feed algorithm

```
hot_score = max(upvotes - downvotes, 0) / (hours_old + 2)^1.5
```

Fresh slot injection: every 5th position in the feed is reserved for a piece/outfit approved in the last 24h with < 3 total votes. This guarantees cold-start exposure (~20% of feed).

Code: `src/lib/feed/ranking.ts`

## CI/CD flow (2 environments)

```
feature/X → PR to main
  → build-test (lint + typecheck + unit tests + build)
  → deploy to dev (trendpulse-dev Supabase + Vercel preview)
  → Bot comments preview URL on PR

merge to main
  → build-test
  → deploy to production (trendpulse-prod Supabase + Vercel prod)
  → test-deploy (Playwright smoke tests + Lighthouse)
  → if fail → auto-rollback
```

## What's NOT done yet (next phases)

### Phase 2 — Auth + real data (needs Supabase keys)
- Wire Supabase Auth (email+password + Google OAuth) to login/signup pages
- Replace STUB_PIECES/STUB_OUTFITS with real queries to ranked_pieces() + interleaveFresh()
- Geolocation IP → default city middleware

### Phase 3 — Submit + Voting (needs Supabase Storage)
- `/submit/piece` with photo upload to Supabase Storage + IG/TikTok embed parser
- `/submit/outfit` with photo upload + piece tagging
- VoteButton wired to RPC `vote()`

### Phase 4 — Admin moderation
- `/admin/queue` with approve/reject
- `/admin/cities` with DeepL trigger for new languages
- `scripts/seed-trends.ts` to seed 50 initial trends

### Phase 5 — i18n translation (needs DeepL key)
- Run `pnpm translate --all` to translate 6 locales from en.json

### Phase 6 — Monetization + Legal
- Affiliate redirect `/r/[id]`
- Cookie consent banner (vanilla-cookieconsent)
- Premium waitlist page

### Phase 7 — Analytics
- PostHog events integration
- Vercel Analytics + Sentry

### Phase 8 — Soft launch
- Seed 50 trends
- Invite 10 people
- First Reddit/Discord post

## External accounts needed

### Supabase (2 projects)

Create at https://supabase.com/dashboard:
1. `trendpulse-dev` — for PR previews and local dev
2. `trendpulse-prod` — for production (trendpul.se)

For each, collect:
- Project URL (`https://xxxx.supabase.co`)
- anon public key (Settings → API)
- service_role key (Settings → API)
- Project Ref (Settings → General → Reference ID)
- DB Password

Also create a Personal Access Token at https://supabase.com/dashboard/account/tokens (one token works for both projects).

### Vercel

1. Import repo at https://vercel.com/new
2. Add domain `trendpul.se` in Settings → Domains (point DNS from GoDaddy)
3. Create token at https://vercel.com/account/tokens
4. Get `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` from Settings → General or `.vercel/project.json`

### GitHub Environments

At https://github.com/TrendPul-se/trendpulse/settings/environments create:

**Environment: `dev`** — secrets with trendpulse-dev values:
- `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`, `SUPABASE_ACCESS_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

**Environment: `production`** — same keys with trendpulse-prod values:
- Enable "Required reviewers" (add yourself)
- Restrict to branch `main`

### Branch protection on `main`

Settings → Branches → Add rule → `main`:
- ☑ Require PR before merging
- ☑ Require status checks: `lint-typecheck`, `unit-test`, `build`
- ☑ Do not allow bypassing

### Other accounts

- **DeepL API Free:** https://www.deepl.com/pro-api → `DEEPL_API_KEY`
- **PostHog:** https://posthog.com → `NEXT_PUBLIC_POSTHOG_KEY`
- **Sentry:** https://sentry.io → `SENTRY_DSN`
- **Google OAuth:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → `GOOGLE_OAUTH_CLIENT_ID` + `GOOGLE_OAUTH_CLIENT_SECRET`
- **Beehiiv:** https://beehiiv.com → create newsletter → `NEXT_PUBLIC_BEEHIIV_URL`

## Local development

```bash
# Install deps
pnpm install

# Copy env template and fill in trendpulse-dev values
cp .env.local.example .env.local
# Edit .env.local with your trendpulse-dev keys

# Apply migrations to dev project
pnpm db:reset  # or: supabase db push (if linked)

# Run dev server
pnpm dev

# Run tests
pnpm test           # unit tests (vitest)
pnpm test:e2e       # e2e tests (playwright, needs dev server)

# Translate locales (needs DEEPL_API_KEY in .env.local)
pnpm translate --all

# Check i18n key sync
pnpm i18n:check
```

## Key files reference

| File | Purpose |
|---|---|
| `src/app/[locale]/page.tsx` | Home page |
| `src/app/[locale]/layout.tsx` | Root layout (html tag, NextIntlClientProvider) |
| `src/components/FeedSection.tsx` | Pieces/Outfits feed with city selector |
| `src/components/PieceCard.tsx` | Individual piece card (photo/embed + votes) |
| `src/lib/feed/ranking.ts` | Hot score + fresh slot injection algorithm |
| `src/lib/feed/stub-data.ts` | Mock data (replace with Supabase queries) |
| `src/lib/i18n/cities.ts` | 13 cities seed data |
| `src/i18n/config.ts` | Locale list + names + flags |
| `middleware.ts` | next-intl locale routing |
| `messages/en.json` | Source of truth for all UI strings (135 keys) |
| `supabase/migrations/0001_init.sql` | Tables + enums + RLS policies |
| `supabase/migrations/0002_seed_cities.sql` | 13 cities with i18n names |
| `supabase/migrations/0003_functions.sql` | vote(), ranked_pieces(), fresh_pieces() |
| `scripts/translate.ts` | DeepL batch translation |
| `.github/workflows/build-test.yml` | CI: lint + typecheck + test + build |
| `.github/workflows/deploy.yml` | CD: Supabase migrations + Vercel deploy |
| `.github/workflows/test-deploy.yml` | Post-deploy: Playwright smoke + Lighthouse |

## Business context

See `docs/trendpulse_business_plan_v2.docx` for the full business plan. Key points:
- TrendPulse is a community-powered fashion trend analytics platform
- "Stock market for fashion trends" — users submit, community votes, algorithm ranks
- Two content types: **Pieces** (individual garments) and **Outfits** (combinations)
- Target: Gen Z fashion community, 10K+ members year 1
- Revenue: affiliate links (day 1), newsletter, premium tier ($5-9/mo at 1K members), brand data reports
- Budget: $50/month
- Founder: Octavio E. (teen-led)
