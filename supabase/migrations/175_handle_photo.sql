-- Add handle_photo field to kit_layout (oval photo frame in suitcase handle)
insert into kit_layout (field, x, y, w, h, font_size, bold, color)
values ('handle_photo', 490, 30, 270, 170, null, null, null)
on conflict (field) do nothing;
