-- SQL Migration Script untuk menyisipkan soal Logika dan Gambar Teknik
-- Masukkan soal ini ke Tabel `exams` di Supabase SQL Editor

-- 1. Soal Logika & Psikotes (Paket 1)
INSERT INTO exams (title, description, duration, status, target_class)
VALUES (
    'Tes Logika & Psikotes Dasar',
    'Ujian ini mencakup analogi kata, deret angka, dan logika visual. Petunjuk: Pilih jawaban yang paling tepat. Kerjakan secara mandiri.',
    '45 Menit',
    'Aktif',
    'Semua Kelas'
);

-- 2. Soal Gambar Teknik Dasar (GTO)
INSERT INTO exams (title, description, duration, status, target_class)
VALUES (
    'Ujian Teori Gambar Teknik (GTO)',
    'Ujian teori mengenai standar garis ISO, proyeksi Amerika/Eropa, skala gambar, dan standar kertas gambar A3. Gunakan standar ISO sebagai acuan utama.',
    '60 Menit',
    'Aktif',
    'Semua Kelas'
);
