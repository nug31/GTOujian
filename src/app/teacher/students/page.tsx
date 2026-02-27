"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Wrench,
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
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-indigo-400" />
                        <span className="font-bold text-lg tracking-tight">Ujian GTO</span>
                        <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">Guru</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                            {teacherName.charAt(0)}
                        </div>
                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-400 rounded-full transition-colors"><LogOut className="w-5 h-5" /></button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Navigation Tabs */}
                <div className="mb-6 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        <Link href="/teacher" className="border-transparent text-slate-500 hover:text-slate-700 pb-4 px-1 border-b-2 font-medium text-sm">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-transparent text-slate-500 hover:text-slate-700 pb-4 px-1 border-b-2 font-medium text-sm">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-indigo-500 text-indigo-600 pb-4 px-1 border-b-2 font-medium text-sm">Data Siswa</Link>
                    </nav>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Data Siswa</h1>
                        <p className="text-slate-500 mt-1">Kelola akun siswa yang berhak mengikuti ujian praktik.</p>
                    </div>
                    <button
                        onClick={() => setShowImportModal(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center transition-colors"
                    >
                        <Upload className="w-4 h-4 mr-2" /> Import Excel
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex items-center">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Cari Nama, NISN, atau Kelas..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-slate-900"
                        />
                    </div>
                </div>

                {/* Students Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Lengkap</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">NISN</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Tgl Terdaftar</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {isLoading ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />Memuat data siswa...</td></tr>
                            ) : filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{student.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-mono">{student.nisn}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.class}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {new Date(student.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                            <button
                                                onClick={() => handleDeleteStudent(student.id)}
                                                className="text-slate-400 hover:text-red-600 p-1 rounded-md transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Tidak ada data siswa ditemukan.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Import Modal */}
            <AnimatePresence>
                {showImportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                        >
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-900">Import Data Siswa</h3>
                                <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6">
                                <div className="mb-6">
                                    <p className="text-sm text-slate-600 mb-4">
                                        Gunakan file Excel (.xlsx) dengan kolom: <strong>Nama</strong>, <strong>NISN</strong>, dan <strong>Kelas</strong>.
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5"
                                    >
                                        <Download className="w-3.5 h-3.5" /> Download Template Excel
                                    </button>
                                </div>

                                {importError && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start text-red-700 gap-3">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <p className="text-sm">{importError}</p>
                                    </div>
                                )}

                                <div
                                    onClick={() => !isImporting && fileInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${isImporting ? 'bg-slate-50 border-slate-200 cursor-not-allowed' : 'bg-indigo-50/50 border-indigo-200 hover:bg-slate-100 cursor-pointer'
                                        }`}
                                >
                                    {isImporting ? (
                                        <>
                                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-3" />
                                            <p className="text-sm font-medium text-slate-600">Sedang memproses...</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3">
                                                <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Pilih File Excel Siswa</p>
                                            <p className="text-xs text-slate-500 mt-1">.xlsx atau .csv</p>
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

                            <div className="p-6 bg-slate-50 flex justify-end">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
