-- Fix: badge bottom_text y=1178 was off-canvas (canvas is 1080px tall).
-- The ribbon text was completely invisible on every generated badge.
-- Correct position: y=960 places the arc centre 120px above the bottom edge,
-- fully within the 1080px canvas with the 36px font glyphs.
UPDATE template_layout
SET y = 960
WHERE template = 'badge-template'
  AND field     = 'bottom_text'
  AND y         = 1178;
