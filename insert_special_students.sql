-- SQL Script untuk menyisipkan 11 Akun Siswa Khusus Kelas 12
-- Jalankan script ini di Supabase SQL Editor

INSERT INTO students (name, nisn, class)
VALUES 
    ('Siswa Khusus 01', '9990000001', 'XII - KHUSUS'),
    ('Siswa Khusus 02', '9990000002', 'XII - KHUSUS'),
    ('Siswa Khusus 03', '9990000003', 'XII - KHUSUS'),
    ('Siswa Khusus 04', '9990000004', 'XII - KHUSUS'),
    ('Siswa Khusus 05', '9990000005', 'XII - KHUSUS'),
    ('Siswa Khusus 06', '9990000006', 'XII - KHUSUS'),
    ('Siswa Khusus 07', '9990000007', 'XII - KHUSUS'),
    ('Siswa Khusus 08', '9990000008', 'XII - KHUSUS'),
    ('Siswa Khusus 09', '9990000009', 'XII - KHUSUS'),
    ('Siswa Khusus 10', '9990000010', 'XII - KHUSUS'),
    ('Siswa Khusus 11', '9990000011', 'XII - KHUSUS')
ON CONFLICT (nisn) DO NOTHING;

-- Opsional: Verifikasi data yang baru masuk
SELECT * FROM students WHERE class = 'XII - KHUSUS';
