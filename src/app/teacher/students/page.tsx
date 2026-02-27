"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Triangle,
    LogOut,
    Users,
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    AlertCircle,
    Trash2,
    Search,
    Download,
    X,
    Loader2
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

interface Student {
    id: string;
    name: string;
    nisn: string;
    class: string;
    created_at: string;
}

export default function StudentManagementPage() {
    const router = useRouter();
    const [students, setStudents] = useState<Student[]>([]);
    const [teacherName, setTeacherName] = useState("Guru GTO");
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showImportModal, setShowImportModal] = useState(false);
    const [importError, setImportError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) {
            const parsed = JSON.parse(info);
            if (parsed.role === "teacher") setTeacherName(parsed.name);
        }
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('name', { ascending: true });

        if (error) console.error("Error fetching students:", error);
        else setStudents(data || []);
        setIsLoading(false);
    };

    const handleLogout = () => {
        router.push("/login");
    };

    const handleDeleteStudent = async (id: string) => {
        if (!window.confirm("Hapus data siswa ini?")) return;

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) alert("Gagal menghapus siswa.");
        else fetchStudents();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportError(null);

        try {
            const reader = new FileReader();
            reader.onload = async (evt) => {
                try {
                    const bstr = evt.target?.result;
                    const wb = XLSX.read(bstr, { type: 'binary' });
                    const wsname = wb.SheetNames[0];
                    const ws = wb.Sheets[wsname];
                    const data = XLSX.utils.sheet_to_json(ws) as any[];

                    // Basic validation: must have Name, NISN, and Class
                    const formattedData = data.map(item => ({
                        name: item.Name || item.Nama || item.name || item.nama,
                        nisn: String(item.NISN || item.nisn || item.NIS || item.nis),
                        class: item.Class || item.Kelas || item.class || item.kelas
                    })).filter(item => item.name && item.nisn && item.class);

                    if (formattedData.length === 0) {
                        throw new Error("Format file tidak sesuai. Pastikan ada kolom Nama, NISN, dan Kelas.");
                    }

                    const { error } = await supabase
                        .from('students')
                        .insert(formattedData);

                    if (error) {
                        if (error.code === '23505') throw new Error("Beberapa NISN sudah terdaftar di database.");
                        throw error;
                    }

                    setShowImportModal(false);
                    fetchStudents();
                    alert(`Berhasil mengimpor ${formattedData.length} siswa.`);
                } catch (err: any) {
                    setImportError(err.message || "Gagal memproses file Excel.");
                } finally {
                    setIsImporting(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                }
            };
            reader.readAsBinaryString(file);
        } catch (err) {
            setImportError("Terjadi kesalahan saat membaca file.");
            setIsImporting(false);
        }
    };

    const downloadTemplate = () => {
        const ws_data = [
            ["Nama", "NISN", "Kelas"],
            ["Budi Santoso", "12345678", "X TKR 1"],
            ["Andi Wijaya", "12345679", "X TKR 1"]
        ];
        const ws = XLSX.utils.aoa_to_sheet(ws_data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template Siswa");
        XLSX.writeFile(wb, "Template_Import_Siswa.xlsx");
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery) ||
        s.class.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Triangle className="w-5 h-5 text-white fill-white/20" />
                        </div>
                        <div>
                            <span className="font-bold text-xl tracking-tighter text-slate-900 font-outfit text-primary-600">GTO</span>
                            <span className="ml-2 bg-indigo-50 text-indigo-700 border border-indigo-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Dashboard Guru</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800">{teacherName}</p>
                            <p className="text-xs text-slate-500 font-medium">Administrator Penilaian</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                            {teacherName.charAt(0)}
                        </div>
                        <div className="h-6 w-px bg-slate-200 mx-1"></div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Keluar / Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="mb-8 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto hidden-scrollbar">
                        <Link href="/teacher" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-indigo-600 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm tracking-wide">Data Entitas Siswa</Link>
                    </nav>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Manajemen Data Siswa</h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xl">
                            Kelola daftar siswa yang mendapatkan izin akses untuk melakukan _login_ terautentikasi dan mengikuti ujian praktik di sistem ini.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] font-bold text-sm flex items-center transition-all uppercase tracking-wide border border-indigo-500 mt-2 md:mt-0"
                    >
                        <Upload className="w-4 h-4 mr-2.5" /> Import Data Excel
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex items-center relative z-10 w-full sm:w-96 group">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Cari Nama, NISN, atau Kelas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 group-focus-within:bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-900 transition-all outline-none shadow-inner group-focus-within:shadow-none placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200/80">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">NISN</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Kelas</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Tgl Terdaftar</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Tindakan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-500" /><p className="font-medium text-sm">Memuat data entitas...</p></td></tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200/50 flex items-center justify-center text-indigo-600 font-bold text-sm shadow-sm">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="ml-3 text-sm font-bold text-slate-900">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-600 font-mono font-medium bg-slate-50/50">{student.nisn}</td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm font-semibold text-slate-700">
                                            <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">{student.class}</span>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(student.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleDeleteStudent(student.id)}
                                                className="text-slate-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100 opacity-60 group-hover:opacity-100"
                                                title="Hapus Hak Akses Siswa"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                        <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                                        <p className="font-medium">Tidak ada data entitas siswa di sistem saat ini.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="text-xl font-bold text-slate-900 font-outfit">Suntik Data Massal</h3>
                                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 p-1.5 rounded-full transition-colors border border-slate-200 shadow-sm"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-7">
                                <div className="mb-6">
                                    <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                        Pindai otomatis dokumen Excel/CSV dengan ketentuan *header*: <strong className="text-slate-800">Nama</strong>, <strong className="text-slate-800">NISN</strong>, dan <strong className="text-slate-800">Kelas</strong>.
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-1.5 px-3 rounded-lg transition-colors"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Unduh Templat CSV
                                    </button>
                                </div>

                                {importError && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 gap-3 shadow-sm">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm font-medium leading-relaxed">{importError}</p>
                                    </div>
                                )}

                                <div
                                    onClick={() => !isImporting && fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${isImporting ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-indigo-50/30 border-indigo-200/80 hover:bg-slate-50 hover:border-indigo-400 cursor-pointer shadow-sm hover:shadow-md'
                                        }`}
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
                                            <p className="text-sm font-bold text-slate-700 animate-pulse">Memproses Payload...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.05)] border border-slate-100 flex items-center justify-center mb-4 text-indigo-500 group-hover:scale-110 transition-transform">
                                                <FileSpreadsheet className="w-7 h-7" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-800 mb-1">Unggah Berkas Registrasi</p>
                                            <p className="text-xs text-slate-500 font-medium">.XLSX, .XLS, atau .CSV</p>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                        accept=".xlsx, .xls, .csv"
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex justify-end">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all shadow-sm"
                                >
                                    Batalkan Operasi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
