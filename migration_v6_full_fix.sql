-- Jalankan script ini di SQL Editor Supabase untuk memperbaiki seluruh kolom yang hilang
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS student_class TEXT;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tab_switches INTEGER DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT FALSE;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS criteria JSONB;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS feedback TEXT;

-- Paksa refresh cache skema
NOTIFY pgrst, 'reload schema';
