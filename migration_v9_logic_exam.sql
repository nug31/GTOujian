-- Migrasi Database untuk mendukung Ujian Logika & Anti-Cheat

-- 1. Tambah kolom `exam_type` ke tabel `exams`
-- 'practice' = Ujian Praktik CAD (default)
-- 'theory'   = Ujian Teori / Logika (berbasis teks/gambar)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'practice';

-- 2. Tambah kolom `questions` ke tabel `exams`
-- Format JSONB untuk menyimpan array soal pilihan ganda atau pertanyaan teks
ALTER TABLE exams ADD COLUMN IF NOT EXISTS questions JSONB DEFAULT '[]';

-- 3. Tambah kolom `tab_switches` & `answers` ke tabel `submissions` jika belum ada
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS tab_switches INTEGER DEFAULT 0;
ALTER TABLE submissions ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';

-- 4. Update data soal yang sudah ada (untuk paket Logika yang dibuat sebelumnya)
UPDATE exams 
SET exam_type = 'theory' 
WHERE title LIKE '%Logika%' OR title LIKE '%Psikotes%';
