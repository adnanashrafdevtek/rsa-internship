-- Add room column to calendar table if it doesn't exist
ALTER TABLE calendar ADD COLUMN room VARCHAR(50);

-- Update existing schedules with sample room data
UPDATE calendar SET room = '101' WHERE idcalendar = 64;
UPDATE calendar SET room = '102' WHERE idcalendar = 61;
UPDATE calendar SET room = '103' WHERE idcalendar = 59;
UPDATE calendar SET room = 'Lab A' WHERE idcalendar = 58;
UPDATE calendar SET room = 'Gym' WHERE idcalendar = 65;
UPDATE calendar SET room = '201' WHERE idcalendar = 66;
UPDATE calendar SET room = '101' WHERE idcalendar = 70;
UPDATE calendar SET room = 'Lab B' WHERE idcalendar = 86;
UPDATE calendar SET room = '103' WHERE idcalendar = 99;
UPDATE calendar SET room = '102' WHERE idcalendar = 91;
UPDATE calendar SET room = '201' WHERE idcalendar = 100;

-- Check the results
SELECT idcalendar, event_title, room FROM calendar WHERE room IS NOT NULL;