-- Add attitude fields to children table.
-- attitude: the text label set at registration (e.g. "SUPER CURIEUX").
-- attitude_badge_url: optional pre-stored badge PNG (skipped when null — badge is generated inline).
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS attitude      text,
  ADD COLUMN IF NOT EXISTS attitude_badge_url text;
