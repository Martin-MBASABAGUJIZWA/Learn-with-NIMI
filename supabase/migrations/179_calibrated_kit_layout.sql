-- Calibrated kit layout from visual editor — overrides the original seed
UPDATE template_layout SET x = 638, y = 518, w = 133, h = 195                WHERE template = 'kit' AND field = 'photo';
UPDATE template_layout SET x = 490, y = 30                                    WHERE template = 'kit' AND field = 'handle_photo';
UPDATE template_layout SET x = 887, y = 507, font_size = 24                   WHERE template = 'kit' AND field = 'champion';
UPDATE template_layout SET x = 836, y = 537, font_size = 20                   WHERE template = 'kit' AND field = 'age';
UPDATE template_layout SET x = 858, y = 564, font_size = 20                   WHERE template = 'kit' AND field = 'statut';
UPDATE template_layout SET x = 846, y = 599, font_size = 20                   WHERE template = 'kit' AND field = 'vol';
UPDATE template_layout SET x = 895, y = 625, font_size = 18                   WHERE template = 'kit' AND field = 'destination';
UPDATE template_layout SET x = 856, y = 646, font_size = 20                   WHERE template = 'kit' AND field = 'livre';
UPDATE template_layout SET x = 856, y = 667, font_size = 20                   WHERE template = 'kit' AND field = 'siege';
UPDATE template_layout SET x = 863, y = 690, font_size = 20                   WHERE template = 'kit' AND field = 'porte';
UPDATE template_layout SET x = 906, y = 712, font_size = 20                   WHERE template = 'kit' AND field = 'embarquement';
UPDATE template_layout SET x = 613, y = 751, w = 382, h = 40                  WHERE template = 'kit' AND field = 'barcode';
UPDATE template_layout SET x = 1016, y = 958, w = 148, h = 148               WHERE template = 'kit' AND field = 'qr';
