-- 1. Tabel Exams (Soal Ujian)
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    duration TEXT NOT NULL,
    status TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Selesai')),
    due_date TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabel Submissions (Pengumpulan Siswa)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_name TEXT NOT NULL,
    nis TEXT NOT NULL,
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    exam_title TEXT NOT NULL,
    submit_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'graded')),
    score INTEGER,
    onshape_link TEXT NOT NULL,
    criteria JSONB,
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tabel Students (Data Siswa)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    nisn TEXT UNIQUE NOT NULL,
    class TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Tabel Teachers (Data Guru)
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Keamanan RLS
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Reset Policy (Agar bisa dijalankan berulang kali tanpa error)
DROP POLICY IF EXISTS "Allow public read-write for demo" ON exams;
DROP POLICY IF EXISTS "Allow public read-write for demo" ON submissions;
DROP POLICY IF EXISTS "Allow public read-write for demo" ON students;
DROP POLICY IF EXISTS "Allow public read-write for demo" ON teachers;

-- Buat ulang Policy dasar untuk demo
CREATE POLICY "Allow public read-write for demo" ON exams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo" ON submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for demo" ON teachers FOR ALL USING (true) WITH CHECK (true);

-- Tambahkan akun guru awal
INSERT INTO teachers (name, username, password) 
VALUES ('Joko Setyo Nugroho, S.T', 'joko', 'joko123')
ON CONFLICT (username) DO NOTHING;
