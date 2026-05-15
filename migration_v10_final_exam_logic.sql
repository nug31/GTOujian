-- Migration v10: Add is_final_exam column to exams table
ALTER TABLE public.exams 
ADD COLUMN IF NOT EXISTS is_final_exam BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.exams.is_final_exam IS 'Jika TRUE, ujian hanya akan muncul setelah semua tugas lain diselesaikan oleh siswa.';
