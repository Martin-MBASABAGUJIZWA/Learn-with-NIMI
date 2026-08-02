-- Reset all passport-interior field positions to updated code defaults.
-- Previous calibration had book_cover and next_cover on the wrong (left) page.
DELETE FROM template_layout WHERE template = 'passport-interior';
