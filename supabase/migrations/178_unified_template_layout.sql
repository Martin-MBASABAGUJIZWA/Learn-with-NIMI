-- Single table for ALL template layouts.
-- Primary key is (template, field) so any number of templates can coexist.
create table if not exists template_layout (
  template   text        not null,
  field      text        not null,
  x          integer     not null default 0,
  y          integer     not null default 0,
  w          integer,
  h          integer,
  font_size  integer,
  bold       boolean     default true,
  color      text,
  updated_at timestamptz default now(),
  primary key (template, field)
);

alter table template_layout enable row level security;

create policy "service role full access" on template_layout
  using (true) with check (true);

-- Migrate kit_layout data
insert into template_layout (template, field, x, y, w, h, font_size, bold, color, updated_at)
select 'kit', field, x, y, w, h, font_size, bold, color, updated_at
from kit_layout
on conflict (template, field) do nothing;

-- Migrate boarding_pass_layout data
insert into template_layout (template, field, x, y, w, h, font_size, bold, color, updated_at)
select 'boarding-pass', field, x, y, w, h, font_size, bold, color, updated_at
from boarding_pass_layout
on conflict (template, field) do nothing;
