import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Supabase Storage public URLs
      { protocol: 'https', hostname: '*.supabase.co' },
      // Instagram CDN for oEmbed previews
      { protocol: 'https', hostname: '*.cdninstagram.com' },
      // TikTok CDN for oEmbed previews
      { protocol: 'https', hostname: '*.tiktokcdn.com' },
    ],
  },
  typedRoutes: true,
};

export default withNextIntl(nextConfig);
