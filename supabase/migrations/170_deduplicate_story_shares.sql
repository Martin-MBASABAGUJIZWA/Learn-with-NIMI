-- ═══════════════════════════════════════════════════════════════
--  170 — Deduplicate story shares + unique guard
--
--  The client-side picker already blocks re-sharing, but existing
--  rows may have duplicates from before the check was added.
--  1. Delete all but the latest row per (parent_id, story_key).
--  2. Add a partial unique index so the DB enforces this going forward.
-- ═══════════════════════════════════════════════════════════════

-- 1. Remove duplicates — keep the most recent share per parent+story
DELETE FROM creations
WHERE id NOT IN (
  SELECT DISTINCT ON (parent_id, story_key) id
  FROM creations
  WHERE story_key IS NOT NULL
  ORDER BY parent_id, story_key, created_at DESC
)
AND story_key IS NOT NULL;

-- 2. Enforce uniqueness at the DB level going forward
CREATE UNIQUE INDEX IF NOT EXISTS creations_parent_story_key_unique
  ON creations (parent_id, story_key)
  WHERE story_key IS NOT NULL;
