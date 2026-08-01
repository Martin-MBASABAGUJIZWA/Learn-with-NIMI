-- Reset kit text field positions + bump font sizes so text is actually visible
-- The 1254×1254 canvas needs 20–24px font; the original 14–16px was invisible at viewing scale.
update kit_layout set x=918, y=428, font_size=24, bold=true, color='#1a1a2e' where field='champion';
update kit_layout set x=918, y=461, font_size=20, bold=true, color='#1a1a2e' where field='age';
update kit_layout set x=918, y=494, font_size=20, bold=true, color='#16a34a' where field='statut';
update kit_layout set x=918, y=527, font_size=20, bold=true, color='#1a1a2e' where field='vol';
update kit_layout set x=918, y=560, font_size=18, bold=true, color='#1a1a2e' where field='destination';
update kit_layout set x=918, y=593, font_size=20, bold=true, color='#1a1a2e' where field='livre';
update kit_layout set x=918, y=626, font_size=20, bold=true, color='#1a1a2e' where field='siege';
update kit_layout set x=918, y=659, font_size=20, bold=true, color='#1a1a2e' where field='porte';
update kit_layout set x=918, y=692, font_size=20, bold=true, color='#16a34a' where field='embarquement';
