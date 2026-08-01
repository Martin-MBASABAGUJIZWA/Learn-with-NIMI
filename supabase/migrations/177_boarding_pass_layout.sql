create table if not exists boarding_pass_layout (
  field       text primary key,
  x           integer not null default 0,
  y           integer not null default 0,
  w           integer,
  h           integer,
  font_size   integer,
  bold        boolean default true,
  color       text,
  updated_at  timestamptz default now()
);

alter table boarding_pass_layout enable row level security;

create policy "service role full access" on boarding_pass_layout
  using (true) with check (true);

-- Seed defaults (mirror BP constants in buildBoardingPassImage.ts)
-- Canvas: 1080 × 1080
insert into boarding_pass_layout (field, x, y, w, h, font_size, bold, color) values
  ('photo',         42,  268, 295, 372, null, null,  null),
  ('name',         400,  268, null, null, 52,  true,  '#1a1a2e'),
  ('age',          400,  348, null, null, 28,  true,  '#1a1a2e'),
  ('statut',       400,  402, null, null, 28,  true,  '#16a34a'),
  ('vol',          400,  456, null, null, 28,  true,  '#1a1a2e'),
  ('destination',  400,  510, null, null, 28,  true,  '#1a1a2e'),
  ('livre',        400,  564, null, null, 28,  true,  '#1a1a2e'),
  ('siege',        400,  618, null, null, 28,  true,  '#1a1a2e'),
  ('porte',        400,  672, null, null, 28,  true,  '#1a1a2e'),
  ('embarquement', 400,  726, null, null, 28,  true,  '#16a34a'),
  ('barcode',       80,  820, 920, 100,  null, null,  null)
on conflict (field) do nothing;
