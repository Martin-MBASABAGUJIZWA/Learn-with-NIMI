-- Calibrated boarding-pass layout from visual editor
UPDATE template_layout SET x = 139, y = 362, w = 295, h = 372              WHERE template = 'boarding-pass' AND field = 'photo';
UPDATE template_layout SET x = 698, y = 293, font_size = 52                WHERE template = 'boarding-pass' AND field = 'name';
UPDATE template_layout SET x = 610, y = 373, font_size = 28                WHERE template = 'boarding-pass' AND field = 'age';
UPDATE template_layout SET x = 650, y = 434, font_size = 28                WHERE template = 'boarding-pass' AND field = 'statut';
UPDATE template_layout SET x = 652, y = 491, font_size = 28                WHERE template = 'boarding-pass' AND field = 'vol';
UPDATE template_layout SET x = 761, y = 549, font_size = 28                WHERE template = 'boarding-pass' AND field = 'destination';
UPDATE template_layout SET x = 679, y = 603, font_size = 28                WHERE template = 'boarding-pass' AND field = 'livre';
UPDATE template_layout SET x = 675, y = 661, font_size = 28                WHERE template = 'boarding-pass' AND field = 'siege';
UPDATE template_layout SET x = 688, y = 715, font_size = 28                WHERE template = 'boarding-pass' AND field = 'porte';
UPDATE template_layout SET x = 751, y = 771, font_size = 28                WHERE template = 'boarding-pass' AND field = 'embarquement';
UPDATE template_layout SET x = 87,  y = 845, w = 920, h = 100              WHERE template = 'boarding-pass' AND field = 'barcode';
