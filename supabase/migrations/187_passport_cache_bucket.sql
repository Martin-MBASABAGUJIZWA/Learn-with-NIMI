-- Storage bucket for generated passport PDFs.
-- Files are private (service-role only), keyed by child ID, max 20 MB each.
-- TTL is enforced in application code (1-hour window checked via updated_at).

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('passport-cache', 'passport-cache', false, 20971520, '{application/pdf}')
ON CONFLICT (id) DO NOTHING;
