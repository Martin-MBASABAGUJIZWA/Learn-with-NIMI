-- Migration 191: get_story_slots — hide missions with no media uploaded
-- Coloring checks coloring_pages, flipflop checks story_page_versions,
-- all other slots check mission_versions.media_url IS NOT NULL.

create or replace function get_story_slots(
  p_child_id uuid,
  p_story_id uuid,
  p_language text default 'en'
) returns table (
  slot_key     text,
  slot_order   integer,
  mission_id   uuid,
  mission_type text,
  title        text,
  subtitle     text,
  stars        integer,
  completed    boolean
)
language plpgsql security definer stable as $$
begin
  if not is_my_child(p_child_id) then
    raise exception 'not authorized';
  end if;

  return query
  select
    ss.slot_key,
    ss.sort_order,
    ss.mission_id,
    m.type,
    coalesce(
      (select mv1.title from mission_versions mv1
        where mv1.mission_id = m.id and mv1.language = p_language
        order by mv1.revision_number desc limit 1),
      (select mv2.title from mission_versions mv2
        where mv2.mission_id = m.id and mv2.language = 'en'
        order by mv2.revision_number desc limit 1),
      ''
    ),
    coalesce(
      (select mv3.subtitle from mission_versions mv3
        where mv3.mission_id = m.id and mv3.language = p_language
        order by mv3.revision_number desc limit 1),
      (select mv4.subtitle from mission_versions mv4
        where mv4.mission_id = m.id and mv4.language = 'en'
        order by mv4.revision_number desc limit 1),
      ''
    ),
    coalesce(m.stars, 10),
    exists(
      select 1 from child_progress cp
      where cp.child_id = p_child_id
        and cp.mission_id = ss.mission_id
        and cp.language = p_language
    )
  from story_slots ss
  join missions m on m.id = ss.mission_id
  where ss.story_id = p_story_id
    and (
      -- coloring: has at least one coloring template uploaded
      (ss.slot_key = 'coloring' and exists(
        select 1 from coloring_pages cp where cp.story_id = p_story_id
      ))
      or
      -- flipflop_audio: has at least one page with content for this language
      (ss.slot_key = 'flipflop_audio' and exists(
        select 1 from story_pages sp
        join story_page_versions spv on spv.story_page_id = sp.id
        where sp.story_id = p_story_id
          and spv.language = p_language
          and (spv.audio_url is not null or spv.image_url is not null)
      ))
      or
      -- all other missions: at least one version with media uploaded
      (ss.slot_key not in ('coloring', 'flipflop_audio') and exists(
        select 1 from mission_versions mv
        where mv.mission_id = ss.mission_id
          and mv.media_url is not null
      ))
    )
  order by ss.sort_order;
end;
$$;
