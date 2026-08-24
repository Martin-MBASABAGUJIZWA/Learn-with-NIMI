-- Platform-wide key/value settings store
CREATE TABLE IF NOT EXISTS platform_settings (
  key         text PRIMARY KEY,
  value       text,
  updated_at  timestamptz DEFAULT now()
);

-- Seed the intro video key (empty until admin uploads)
INSERT INTO platform_settings (key, value)
VALUES ('nimipiko_intro_video_url', null)
ON CONFLICT (key) DO NOTHING;

-- Track per-child whether the onboarding intro video has been watched
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS nimipiko_intro_watched boolean NOT NULL DEFAULT false;
