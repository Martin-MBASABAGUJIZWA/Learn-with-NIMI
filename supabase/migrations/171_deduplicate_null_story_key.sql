-- ═══════════════════════════════════════════════════════════════
--  171 — Deduplicate posts where story_key IS NULL
--
--  Old shares created before story_key was introduced have
--  story_key = NULL so migration 170 skipped them.
--  Here we identify duplicates by (parent_id, child_name, type,
--  image_url) and keep only the most recent one.
-- ═══════════════════════════════════════════════════════════════

DELETE FROM creations a
USING creations b
WHERE a.story_key IS NULL
  AND b.story_key IS NULL
  AND a.parent_id  = b.parent_id
  AND a.child_name = b.child_name
  AND a.type       = b.type
  AND coalesce(a.image_url, '') = coalesce(b.image_url, '')
  AND a.created_at < b.created_at;
