-- Seed the 13 preconfigured cities
-- Kept in sync with src/lib/i18n/cities.ts

insert into public.cities (slug, name_i18n, country_code, official_languages, default_language, timezone, lat, lng) values
  ('tokyo',       '{"en":"Tokyo","ja":"東京","es":"Tokio","fr":"Tokyo","ko":"도쿄","pt":"Tóquio","da":"Tokyo"}'::jsonb,            'JP', ARRAY['ja'], 'ja', 'Asia/Tokyo',        35.6762,  139.6503),
  ('london',      '{"en":"London","ja":"ロンドン","es":"Londres","fr":"Londres","ko":"런던","pt":"Londres","da":"London"}'::jsonb,  'GB', ARRAY['en'], 'en', 'Europe/London',     51.5074,   -0.1278),
  ('new-york',    '{"en":"New York","ja":"ニューヨーク","es":"Nueva York","fr":"New York","ko":"뉴욕","pt":"Nova York","da":"New York"}'::jsonb, 'US', ARRAY['en'], 'en', 'America/New_York', 40.7128,  -74.0060),
  ('paris',       '{"en":"Paris","ja":"パリ","es":"París","fr":"Paris","ko":"파리","pt":"Paris","da":"Paris"}'::jsonb,              'FR', ARRAY['fr'], 'fr', 'Europe/Paris',      48.8566,    2.3522),
  ('lagos',       '{"en":"Lagos","ja":"ラゴス","es":"Lagos","fr":"Lagos","ko":"라고스","pt":"Lagos","da":"Lagos"}'::jsonb,           'NG', ARRAY['en'], 'en', 'Africa/Lagos',       6.5244,    3.3792),
  ('copenhagen',  '{"en":"Copenhagen","ja":"コペンハーゲン","es":"Copenhague","fr":"Copenhague","ko":"코펜하겐","pt":"Copenhaga","da":"København"}'::jsonb, 'DK', ARRAY['da'], 'da', 'Europe/Copenhagen', 55.6761, 12.5683),
  ('seoul',       '{"en":"Seoul","ja":"ソウル","es":"Seúl","fr":"Séoul","ko":"서울","pt":"Seul","da":"Seoul"}'::jsonb,                'KR', ARRAY['ko'], 'ko', 'Asia/Seoul',        37.5665,  126.9780),
  ('mexico-city', '{"en":"Mexico City","ja":"メキシコシティ","es":"Ciudad de México","fr":"Mexico","ko":"멕시코시티","pt":"Cidade do México","da":"Mexico City"}'::jsonb, 'MX', ARRAY['es'], 'es', 'America/Mexico_City', 19.4326, -99.1332),
  ('madrid',      '{"en":"Madrid","ja":"マドリード","es":"Madrid","fr":"Madrid","ko":"마드리드","pt":"Madrid","da":"Madrid"}'::jsonb,   'ES', ARRAY['es'], 'es', 'Europe/Madrid',     40.4168,   -3.7038),
  ('bogota',      '{"en":"Bogotá","ja":"ボゴタ","es":"Bogotá","fr":"Bogota","ko":"보고타","pt":"Bogotá","da":"Bogotá"}'::jsonb,       'CO', ARRAY['es'], 'es', 'America/Bogota',     4.7110,  -74.0721),
  ('santiago',    '{"en":"Santiago","ja":"サンティアゴ","es":"Santiago","fr":"Santiago","ko":"산티아고","pt":"Santiago","da":"Santiago"}'::jsonb, 'CL', ARRAY['es'], 'es', 'America/Santiago', -33.4489, -70.6693),
  ('sao-paulo',   '{"en":"São Paulo","ja":"サンパウロ","es":"São Paulo","fr":"São Paulo","ko":"상파울루","pt":"São Paulo","da":"São Paulo"}'::jsonb, 'BR', ARRAY['pt'], 'pt', 'America/Sao_Paulo', -23.5505, -46.6333),
  ('lisbon',      '{"en":"Lisbon","ja":"リスボン","es":"Lisboa","fr":"Lisbonne","ko":"리스본","pt":"Lisboa","da":"Lissabon"}'::jsonb, 'PT', ARRAY['pt'], 'pt', 'Europe/Lisbon',     38.7223,   -9.1393);
