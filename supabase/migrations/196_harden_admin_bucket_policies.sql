-- ============================================================
-- 196: Harden storyBook + Coloriage bucket policies (DEBT-001)
--
-- Phase 61 audit identified that storyBook and Coloriage buckets
-- allow any authenticated user to INSERT, UPDATE, and DELETE objects
-- (policy: auth.uid() IS NOT NULL).
--
-- These buckets contain admin-uploaded content (story media assets
-- and coloring page templates). Parents should never be able to
-- upload, modify, or delete this content. All write operations
-- are restricted to is_admin() only.
--
-- READ access is unchanged (public).
-- ============================================================


-- ── storyBook: admin-only INSERT ───────────────────────────────

DROP POLICY IF EXISTS "Auth upload storyBook" ON storage.objects;
CREATE POLICY "Admin upload storyBook"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'storyBook' AND is_admin());


-- ── storyBook: admin-only UPDATE ───────────────────────────────

DROP POLICY IF EXISTS "Auth update storyBook" ON storage.objects;
CREATE POLICY "Admin update storyBook"
  ON storage.objects FOR UPDATE
  USING     (bucket_id = 'storyBook' AND is_admin())
  WITH CHECK (bucket_id = 'storyBook' AND is_admin());


-- ── storyBook: admin-only DELETE ───────────────────────────────

DROP POLICY IF EXISTS "Auth delete storyBook" ON storage.objects;
CREATE POLICY "Admin delete storyBook"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'storyBook' AND is_admin());


-- ── Coloriage: admin-only INSERT ───────────────────────────────

DROP POLICY IF EXISTS "Auth upload Coloriage" ON storage.objects;
CREATE POLICY "Admin upload Coloriage"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'Coloriage' AND is_admin());


-- ── Coloriage: admin-only UPDATE ───────────────────────────────

DROP POLICY IF EXISTS "Auth update Coloriage" ON storage.objects;
CREATE POLICY "Admin update Coloriage"
  ON storage.objects FOR UPDATE
  USING     (bucket_id = 'Coloriage' AND is_admin())
  WITH CHECK (bucket_id = 'Coloriage' AND is_admin());


-- ── Coloriage: admin-only DELETE ───────────────────────────────

DROP POLICY IF EXISTS "Auth delete Coloriage" ON storage.objects;
CREATE POLICY "Admin delete Coloriage"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'Coloriage' AND is_admin());
