-- Pastikan kolom student_class ada di tabel submissions
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='submissions' AND column_name='student_class') THEN
        ALTER TABLE submissions ADD COLUMN student_class TEXT;
    END IF;
END $$;

-- Refresh cache skema (opsional, biasanya otomatis setelah alter)
NOTIFY pgrst, 'reload schema';
