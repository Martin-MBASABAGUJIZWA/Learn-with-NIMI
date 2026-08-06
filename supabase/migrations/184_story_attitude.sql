-- Each story/book awards an attitude when completed.
-- The badge builder reads the attitude from the first completed story.
ALTER TABLE stories
  ADD COLUMN IF NOT EXISTS attitude text;

-- Seed Book 1 attitude so testing works immediately
UPDATE stories SET attitude = 'SUPER CURIEUX' WHERE sort_order = 1;
