-- Seed default layout for the badge-template into template_layout.
-- This ensures buildAttitudeBadge reads consistent positions even before
-- the admin opens KitLayoutEditor and saves the badge template.
-- Values match INIT_BADGE in app/admin/KitLayoutEditor.tsx.

INSERT INTO template_layout (template, field, x, y, w, h, font_size, color)
VALUES
  ('badge-template', 'child_photo', 407,  503, 330, 380, null,  null),
  ('badge-template', 'piko',        571,  499, 275, 340, null,  null),
  -- attitude arc: x = centre-x, y = apex-y, w = left-curve-radius, h = right-curve-radius, font_size = px
  ('badge-template', 'attitude',    630,  362, 1500, 1500, 85,  '#7A5100'),
  -- bottom_text: same arc convention; y = apex (centre is lowest, edges curve upward)
  ('badge-template', 'bottom_text', 637,  960, 1800, 1800, 36,  '#C9A227')
ON CONFLICT (template, field) DO NOTHING;
