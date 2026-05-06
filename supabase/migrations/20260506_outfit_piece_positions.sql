-- Add visual-tagging coordinates to outfit_pieces.
-- Position is normalized 0–100 (percent of image width/height) so it's
-- resolution-independent. Default to 50 (center) for any pre-existing rows.

alter table public.outfit_pieces
  add column if not exists position_x numeric(5, 2) not null default 50
    check (position_x >= 0 and position_x <= 100),
  add column if not exists position_y numeric(5, 2) not null default 50
    check (position_y >= 0 and position_y <= 100);
