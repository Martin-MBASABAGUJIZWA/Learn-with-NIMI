-- Clear stale passport-interior layout positions (calibrated on wrong objectFit display)
-- Builder and editor are now both locked to 2200×1100 with objectFit:fill,
-- so coordinates saved before this migration are invalid.
DELETE FROM template_layout WHERE template = 'passport-interior';
