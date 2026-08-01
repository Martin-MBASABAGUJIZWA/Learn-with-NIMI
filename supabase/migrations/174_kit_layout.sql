-- Kit overlay layout — one row per field, editable from admin without code deploy
create table if not exists kit_layout (
  field       text primary key,
  x           integer not null default 0,
  y           integer not null default 0,
  w           integer,        -- area fields only (photo, barcode, qr)
  h           integer,        -- area fields only
  font_size   integer,        -- text fields only
  bold        boolean default true,
  color       text,           -- text fields only
  updated_at  timestamptz default now()
);

alter table kit_layout enable row level security;

-- Service role has full access (API routes use service client)
create policy "service role full access" on kit_layout
  using (true) with check (true);

-- Seed defaults (mirror the constants in buildKitImage.ts)
insert into kit_layout (field, x, y, w, h, font_size, bold, color) values
  ('photo',        707, 428, 137, 218,  null, null,  null),
  ('champion',     912, 428, null, null, 16,  true,  '#1a1a2e'),
  ('age',          912, 463, null, null, 16,  true,  '#1a1a2e'),
  ('statut',       912, 498, null, null, 16,  true,  '#16a34a'),
  ('vol',          912, 533, null, null, 16,  true,  '#1a1a2e'),
  ('destination',  912, 568, null, null, 14,  true,  '#1a1a2e'),
  ('livre',        912, 603, null, null, 16,  true,  '#1a1a2e'),
  ('siege',        912, 638, null, null, 16,  true,  '#1a1a2e'),
  ('porte',        912, 673, null, null, 16,  true,  '#1a1a2e'),
  ('embarquement', 912, 708, null, null, 16,  true,  '#16a34a'),
  ('barcode',      703, 750, 382,  40,  null, null,  null),
  ('qr',          1058, 898, 148, 148,  null, null,  null)
on conflict (field) do nothing;
