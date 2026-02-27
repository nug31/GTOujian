"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, CheckCircle2, ChevronRight, LogOut, FileText, Search, Clock, AlertCircle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/dataStore";

// Mock data submissions
export default function TeacherDashboard() {
    const router = useRouter();
    const [filter, setFilter] = useState<"all" | "pending" | "graded">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [teacherName, setTeacherName] = useState("Bpk. Ahmad Riyadi, S.T.");
    const { submissions, fetchSubmissions, deleteSubmission, isLoading } = useAppStore();

    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) {
            const parsed = JSON.parse(info);
            if (parsed.role === "teacher") setTeacherName(parsed.name);
        }
        fetchSubmissions();
    }, [fetchSubmissions]);

    const handleLogout = () => {
        router.push("/login");
    };

    const filteredSubmissions = submissions.filter((sub) => {
        const matchesFilter = filter === "all" || sub.status === filter;
        const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.nis.includes(searchQuery);
        return matchesFilter && matchesSearch;
    });

    const formatDateTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-lg tracking-tight text-slate-900 font-outfit">Ujian GTO</span>
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

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs Navigation */}
                <div className="mb-8 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto hidden-scrollbar">
                        <Link href="/teacher" className="border-indigo-600 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm tracking-wide">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Data Entitas Siswa</Link>
                    </nav>
                </div>

                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Validasi Pengumpulan Ujian</h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xl">
                            Pantau, tinjau, dan berikan penilaian terhadap tugas-tugas *blueprint* 3D yang telah diserahkan oleh seluruh siswa.
                        </p>
                    </div>

                    {/* KPI Cards Mini */}
                    <div className="flex gap-4">
                        <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl border border-amber-100/50">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Antrean Nilai</p>
                                <p className="text-2xl font-black text-slate-800 font-outfit">{submissions.filter(s => s.status === 'pending').length}</p>
                            </div>
                        </div>
                        <div className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-shadow">
                            <div className="p-3 bg-green-50 text-green-500 rounded-xl border border-green-100/50">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Selesai Dinilai</p>
                                <p className="text-2xl font-black text-slate-800 font-outfit">{submissions.filter(s => s.status === 'graded').length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto overflow-hidden">
                        <button
                            onClick={() => setFilter("all")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "all" ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Semua Tinjauan
                        </button>
                        <button
                            onClick={() => setFilter("pending")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "pending" ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Menunggu Penilaian
                        </button>
                        <button
                            onClick={() => setFilter("graded")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "graded" ? "bg-white text-green-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Selesai Dinilai
                        </button>
                    </div>

                    <div className="relative w-full sm:w-80 group pr-2 hidden sm:block">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama atau NIS siswa..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 group-focus-within:bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm text-slate-800 placeholder-slate-400 transition-all outline-none shadow-inner group-focus-within:shadow-none"
                        />
                    </div>
                </div>

                {/* Submissions List */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200/80">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Siswa
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Ujian
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Waktu Kumpul
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                        <p>Memuat data pengumpulan...</p>
                                    </td>
                                </tr>
                            ) : filteredSubmissions.length > 0 ? (
                                filteredSubmissions.map((sub, index) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={sub.id}
                                        className="hover:bg-slate-50 transition-colors group"
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm">
                                                    {sub.studentName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{sub.studentName}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5 font-mono">{sub.nis}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-800 flex items-center bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-200/60">
                                                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                                                {sub.examTitle}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap flex flex-col items-start justify-center">
                                            <span className="text-slate-600 font-mono text-xs font-medium">{formatDateTime(sub.submitTime)}</span>
                                            {sub.isLate && (
                                                <span className="mt-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-black tracking-widest uppercase border border-red-200 shadow-sm">
                                                    Terlambat Lewat Batas Waktu
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {sub.status === "graded" ? (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-green-50 text-green-700 border border-green-200/60 items-center justify-center gap-1.5 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Nilai Akhir: {sub.score}
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 items-center justify-center gap-1.5 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pending Appraisal
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {sub.status === "graded" && (
                                                    <button
                                                        onClick={() => router.push(`/teacher/grade/${sub.id}`)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                                                        title="Revisi Nilai"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Hapus permanen berkas ujian dari ${sub.studentName}?`)) {
                                                            deleteSubmission(sub.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                                    title="Hapus Pengumpulan"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/teacher/grade/${sub.id}`)}
                                                    className={`inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] text-white ${sub.status === "graded" ? "bg-slate-800 hover:bg-slate-700" : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                                        } transition-all uppercase tracking-wide`}
                                                >
                                                    {sub.status === "graded" ? "Lihat Detail" : "Beri Nilai"}
                                                    <ChevronRight className="ml-1.5 w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="w-8 h-8 text-slate-300 mb-2" />
                                            <p>Tidak ada data siswa yang sesuai pencarian atau filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>
        </div>
    );
}
