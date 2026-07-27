-- 172 — Allow admins to delete any community post
-- Admins already have SELECT + UPDATE (moderate) policies on creations.
-- This adds the missing DELETE policy so the admin community manager
-- can permanently remove posts without needing the service role key.

create policy "admin: delete any creation" on creations
  for delete using (is_admin());
