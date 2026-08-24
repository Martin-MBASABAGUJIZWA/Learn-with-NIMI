-- Migration 188: Extend story_slots for the full 12-step Book 1 journey
--
-- Adds 4 new slot types: challenge_1, challenge_2, challenge_3, destination_video
-- Raises sort_order ceiling from 6 → 10
-- Adds giant_book_url to stories (entry-point image displayed before story begins)

-- 1. Drop old slot_key check and replace with extended list
alter table story_slots
  drop constraint if exists story_slots_slot_key_check;

alter table story_slots
  add constraint story_slots_slot_key_check
  check (slot_key in (
    'flipflop_audio', 'story_pdf', 'coloring',
    'move_explore', 'sing_along', 'bonus_video',
    'challenge_1', 'challenge_2', 'challenge_3',
    'destination_video'
  ));

-- 2. Drop old sort_order check and allow up to 10
alter table story_slots
  drop constraint if exists story_slots_sort_order_check;

alter table story_slots
  add constraint story_slots_sort_order_check
  check (sort_order between 1 and 10);

-- 3. Giant Book entry-point image stored on the story itself
alter table stories
  add column if not exists giant_book_url text;

comment on column stories.giant_book_url is
  'Large interactive entry-point image displayed before the story begins. '
  'Child clicks it to start the FlipFlop Audio slot.';
