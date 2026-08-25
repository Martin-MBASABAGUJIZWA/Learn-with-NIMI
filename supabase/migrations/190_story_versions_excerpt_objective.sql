-- Migration 190: Add excerpt and learning_objective to story_versions
ALTER TABLE story_versions
  ADD COLUMN IF NOT EXISTS excerpt text,
  ADD COLUMN IF NOT EXISTS learning_objective text;
