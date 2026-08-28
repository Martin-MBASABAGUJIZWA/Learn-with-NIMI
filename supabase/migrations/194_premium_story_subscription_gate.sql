-- Gate premium stories on active subscription in _sa_is_story_unlocked.
-- Free stories (is_free = true) are always accessible.
-- Premium stories (is_free = false) require the child's parent to have an
-- active subscription, or a past_due subscription still within grace period.
create or replace function _sa_is_story_unlocked(
  p_child_id uuid,
  p_story_id uuid,
  p_language text
) returns boolean
language plpgsql security definer stable as $$
declare
  v_status  text;
  v_is_free boolean;
  v_parent  uuid;
begin
  select s.status, s.is_free into v_status, v_is_free
  from stories s where s.id = p_story_id;

  -- Story must be published
  if v_status is null or v_status <> 'published' then return false; end if;

  -- Free stories are always accessible
  if v_is_free then return true; end if;

  -- Premium story: look up the parent of this child
  select c.parent_id into v_parent from children c where c.id = p_child_id;
  if v_parent is null then return false; end if;

  -- Active subscription → full access
  if exists(
    select 1 from nimipiko_subscriptions ns
    where ns.parent_id = v_parent
      and ns.status = 'active'
  ) then return true; end if;

  -- Past-due but still within grace period → access continues until grace_ends_at
  return exists(
    select 1 from nimipiko_subscriptions ns
    where ns.parent_id = v_parent
      and ns.status = 'past_due'
      and ns.grace_ends_at is not null
      and ns.grace_ends_at > now()
  );
end;
$$;
