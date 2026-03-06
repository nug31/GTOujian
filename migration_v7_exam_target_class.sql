-- Migration V7: Add target_class to exams table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='exams' AND column_name='target_class') THEN
        ALTER TABLE exams ADD COLUMN target_class TEXT;
    END IF;
END $$;

COMMENT ON COLUMN exams.target_class IS 'The class for which this exam is intended. If NULL, it might be for all classes (though implementation currently filters by specific class).';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
