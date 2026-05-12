-- SQL Migration for Smart Fish Feeder

-- 1. Create Schedules table
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    time TIME NOT NULL,
    duration INTEGER DEFAULT 5,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Create Device Status table
CREATE TABLE IF NOT EXISTS device_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    last_heartbeat TIMESTAMPTZ DEFAULT now(),
    manual_feed_trigger BOOLEAN DEFAULT false
);

-- 3. Insert initial device status if not exists
INSERT INTO device_status (manual_feed_trigger)
SELECT false
WHERE NOT EXISTS (SELECT 1 FROM device_status);

-- 4. Enable Realtime for these tables
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE device_status;

-- 5. Set up RLS (Row Level Security) - Simplified for prototype
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public access for prototype" ON schedules FOR ALL USING (true);
CREATE POLICY "Allow public access for prototype" ON device_status FOR ALL USING (true);
