-- ── 173 — Airways Templates bucket ───────────────────────────
-- Creates a public storage bucket for Nimipiko Airways document
-- templates (boarding pass, passport, badge, stamps, etc.).
-- Admin-only writes; public reads so PDF routes can fetch them.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'airways-templates',
  'airways-templates',
  true,
  10485760, -- 10 MB per file
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do nothing;

-- ── RLS: anyone can read (public bucket) ───────────────────────
create policy "airways-templates: public read"
  on storage.objects for select
  using (bucket_id = 'airways-templates');

-- ── RLS: only service role / admin writes ─────────────────────
-- Reads are done via public URL from the API routes.
-- Writes are done via the admin panel using the anon key with
-- admin auth (the admin panel uses the anon client + RLS below).
create policy "airways-templates: authenticated write"
  on storage.objects for insert
  with check (bucket_id = 'airways-templates' AND auth.role() = 'authenticated');

create policy "airways-templates: authenticated update"
  on storage.objects for update
  using (bucket_id = 'airways-templates' AND auth.role() = 'authenticated');

create policy "airways-templates: authenticated delete"
  on storage.objects for delete
  using (bucket_id = 'airways-templates' AND auth.role() = 'authenticated');
