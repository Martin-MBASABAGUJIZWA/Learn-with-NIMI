-- ============================================================
-- 195: Security isolation fixes (Phase 61 audit)
--
-- Fixes three confirmed vulnerabilities:
--
--  VUL-001 (HIGH): creations storage bucket UPDATE/DELETE allowed
--    any authenticated user to overwrite or delete another parent's
--    community artwork. Policy now restricts to owner = auth.uid().
--
--  VUL-002 (HIGH): avatars storage bucket UPDATE/DELETE had the
--    same overly-broad policy — any auth user could overwrite or
--    delete another child's avatar photo.
--
--  VUL-003 (MEDIUM): nimi_gate_check() accepted an arbitrary
--    p_child_id without verifying the child belongs to p_parent_id.
--    Parent A could exhaust Child B's free Nimi daily message quota
--    by passing Child B's UUID in repeated requests.
--
--  GAP-001 (LOW): get_current_story() and get_unlocked_stories()
--    lacked the is_my_child() ownership guard present in all other
--    SA-1.2 RPCs. Any auth user could infer another child's story
--    progress state (which story they're on / which are unlocked).
-- ============================================================


-- ── VUL-001: creations bucket — own-file-only UPDATE / DELETE ──

DROP POLICY IF EXISTS "Auth update creations" ON storage.objects;
CREATE POLICY "Auth update own creations"
  ON storage.objects FOR UPDATE
  USING  (bucket_id = 'creations' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'creations' AND owner = auth.uid());

DROP POLICY IF EXISTS "Auth delete creations" ON storage.objects;
CREATE POLICY "Auth delete own creations"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'creations' AND owner = auth.uid());


-- ── VUL-002: avatars bucket — own-file-only UPDATE / DELETE ────

DROP POLICY IF EXISTS "Auth update avatars" ON storage.objects;
CREATE POLICY "Auth update own avatars"
  ON storage.objects FOR UPDATE
  USING  (bucket_id = 'avatars' AND owner = auth.uid())
  WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());

DROP POLICY IF EXISTS "Auth delete avatars" ON storage.objects;
CREATE POLICY "Auth delete own avatars"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND owner = auth.uid());


-- ── VUL-003: nimi_gate_check — add child ownership guard ───────

CREATE OR REPLACE FUNCTION nimi_gate_check(
  p_parent_id uuid,
  p_child_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_subscribed boolean;
  v_new_count  integer;
BEGIN
  -- Verify child belongs to the caller (when provided).
  -- This prevents Parent A from exhausting Child B's daily quota.
  IF p_child_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM children
      WHERE id        = p_child_id
        AND parent_id = p_parent_id
    ) THEN
      RAISE EXCEPTION 'Unauthorized';
    END IF;
  END IF;

  -- 1. Active subscription? → always allowed, no count increment.
  v_subscribed := has_active_subscription(p_parent_id);
  IF v_subscribed THEN
    RETURN jsonb_build_object('allowed', true, 'subscribed', true);
  END IF;

  -- 2. No childId (guest) → allow but don't track.
  IF p_child_id IS NULL THEN
    RETURN jsonb_build_object('allowed', true, 'subscribed', false);
  END IF;

  -- 3. Atomically increment today's count and check the daily cap (10).
  WITH upserted AS (
    INSERT INTO nimi_message_counts (child_id, date, count)
    VALUES (p_child_id, current_date, 1)
    ON CONFLICT (child_id, date) DO UPDATE
      SET count = nimi_message_counts.count + 1
    RETURNING count
  )
  SELECT count INTO v_new_count FROM upserted;

  RETURN jsonb_build_object(
    'allowed',    v_new_count <= 10,
    'subscribed', false,
    'count',      v_new_count,
    'limit',      10
  );
END;
$$;

GRANT EXECUTE ON FUNCTION nimi_gate_check(uuid, uuid) TO authenticated;


-- ── GAP-001: get_current_story — add is_my_child guard ─────────

CREATE OR REPLACE FUNCTION get_current_story(
  p_child_id uuid,
  p_language text DEFAULT 'en'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_story record;
  v_last  uuid;
BEGIN
  IF NOT is_my_child(p_child_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR v_story IN
    SELECT s.id AS sid
    FROM stories s
    WHERE s.status = 'published'
    ORDER BY s.sort_order ASC
  LOOP
    IF NOT _sa_is_story_complete(p_child_id, v_story.sid, p_language) THEN
      RETURN v_story.sid;
    END IF;
    v_last := v_story.sid;
  END LOOP;
  RETURN v_last;
END;
$$;


-- ── GAP-001: get_unlocked_stories — add is_my_child guard ──────

CREATE OR REPLACE FUNCTION get_unlocked_stories(
  p_child_id uuid,
  p_language text DEFAULT 'en'
) RETURNS TABLE (sid uuid)
LANGUAGE plpgsql SECURITY DEFINER STABLE AS $$
DECLARE
  v_story record;
BEGIN
  IF NOT is_my_child(p_child_id) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  FOR v_story IN
    SELECT s.id AS xid, s.sort_order AS xorder
    FROM stories s
    WHERE s.status = 'published'
    ORDER BY s.sort_order ASC
  LOOP
    IF _sa_is_story_unlocked(p_child_id, v_story.xid, p_language) THEN
      sid := v_story.xid;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;
