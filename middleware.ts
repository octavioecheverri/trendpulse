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
