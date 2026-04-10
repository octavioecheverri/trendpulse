import type { Locale } from '@/i18n/config';

/**
 * Seed data for preconfigured cities. Mirrors the rows inserted by
 * supabase/migrations/0002_seed_cities.sql. Kept in sync manually; this
 * file is used for client-side dropdowns and middleware IP → city lookup.
 */

export type CitySeed = {
  slug: string;
  countryCode: string;
  officialLanguages: Locale[];
  defaultLanguage: Locale;
  timezone: string;
  lat: number;
  lng: number;
};

export const CITIES: CitySeed[] = [
  {
    slug: 'tokyo',
    countryCode: 'JP',
    officialLanguages: ['ja'],
    defaultLanguage: 'ja',
    timezone: 'Asia/Tokyo',
    lat: 35.6762,
    lng: 139.6503,
  },
  {
    slug: 'london',
    countryCode: 'GB',
    officialLanguages: ['en'],
    defaultLanguage: 'en',
    timezone: 'Europe/London',
    lat: 51.5074,
    lng: -0.1278,
  },
  {
    slug: 'new-york',
    countryCode: 'US',
    officialLanguages: ['en'],
    defaultLanguage: 'en',
    timezone: 'America/New_York',
    lat: 40.7128,
    lng: -74.006,
  },
  {
    slug: 'paris',
    countryCode: 'FR',
    officialLanguages: ['fr'],
    defaultLanguage: 'fr',
    timezone: 'Europe/Paris',
    lat: 48.8566,
    lng: 2.3522,
  },
  {
    slug: 'lagos',
    countryCode: 'NG',
    officialLanguages: ['en'],
    defaultLanguage: 'en',
    timezone: 'Africa/Lagos',
    lat: 6.5244,
    lng: 3.3792,
  },
  {
    slug: 'copenhagen',
    countryCode: 'DK',
    officialLanguages: ['da'],
    defaultLanguage: 'da',
    timezone: 'Europe/Copenhagen',
    lat: 55.6761,
    lng: 12.5683,
  },
  {
    slug: 'seoul',
    countryCode: 'KR',
    officialLanguages: ['ko'],
    defaultLanguage: 'ko',
    timezone: 'Asia/Seoul',
    lat: 37.5665,
    lng: 126.978,
  },
  {
    slug: 'mexico-city',
    countryCode: 'MX',
    officialLanguages: ['es'],
    defaultLanguage: 'es',
    timezone: 'America/Mexico_City',
    lat: 19.4326,
    lng: -99.1332,
  },
  {
    slug: 'madrid',
    countryCode: 'ES',
    officialLanguages: ['es'],
    defaultLanguage: 'es',
    timezone: 'Europe/Madrid',
    lat: 40.4168,
    lng: -3.7038,
  },
  {
    slug: 'bogota',
    countryCode: 'CO',
    officialLanguages: ['es'],
    defaultLanguage: 'es',
    timezone: 'America/Bogota',
    lat: 4.711,
    lng: -74.0721,
  },
  {
    slug: 'santiago',
    countryCode: 'CL',
    officialLanguages: ['es'],
    defaultLanguage: 'es',
    timezone: 'America/Santiago',
    lat: -33.4489,
    lng: -70.6693,
  },
  {
    slug: 'sao-paulo',
    countryCode: 'BR',
    officialLanguages: ['pt'],
    defaultLanguage: 'pt',
    timezone: 'America/Sao_Paulo',
    lat: -23.5505,
    lng: -46.6333,
  },
  {
    slug: 'lisbon',
    countryCode: 'PT',
    officialLanguages: ['pt'],
    defaultLanguage: 'pt',
    timezone: 'Europe/Lisbon',
    lat: 38.7223,
    lng: -9.1393,
  },
];

/** Map of country code → default city slug for IP → city fallback. */
export const COUNTRY_TO_CITY: Record<string, string> = Object.fromEntries(
  CITIES.map((c) => [c.countryCode, c.slug])
);

export function findCityBySlug(slug: string): CitySeed | undefined {
  return CITIES.find((c) => c.slug === slug);
}
