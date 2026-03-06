-- Migration V8: Add is_remedial and parent_exam_id to exams table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='exams' AND column_name='is_remedial') THEN
        ALTER TABLE exams ADD COLUMN is_remedial BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='exams' AND column_name='parent_exam_id') THEN
        ALTER TABLE exams ADD COLUMN parent_exam_id UUID REFERENCES exams(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON COLUMN exams.is_remedial IS 'Whether this exam is a remedial task for a previous exam.';
COMMENT ON COLUMN exams.parent_exam_id IS 'The ID of the original exam that this remedial task is for.';

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
