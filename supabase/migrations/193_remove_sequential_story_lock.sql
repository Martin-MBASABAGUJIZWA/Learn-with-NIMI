-- Remove sequential story unlock requirement.
-- All published stories are now accessible to any child regardless of
-- whether the previous story has been completed.
create or replace function _sa_is_story_unlocked(
  p_child_id uuid,
  p_story_id uuid,
  p_language text
) returns boolean
language plpgsql security definer stable as $$
declare
  v_status text;
begin
  select s.status into v_status
  from stories s where s.id = p_story_id;

  -- Only gate on published status — no sequential completion required
  return v_status = 'published';
end;
$$;
