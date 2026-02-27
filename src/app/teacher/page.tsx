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
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-100">{teacherName}</p>
                            <p className="text-xs text-slate-400">Guru GTO</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            {teacherName.charAt(0)}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs Navigation */}
                <div className="mb-6 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8">
                        <Link href="/teacher" className="border-indigo-500 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">Data Siswa</Link>
                    </nav>
                </div>

                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Dashboard Penilaian Guru</h1>
                        <p className="text-slate-500 mt-1">Daftar pengumpulan ujian siswa kelas XII TKR 1.</p>
                    </div>

                    {/* KPI Cards Mini */}
                    <div className="flex gap-4">
                        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Belum Dinilai</p>
                                <p className="text-xl font-bold text-slate-800">{submissions.filter(s => s.status === 'pending').length}</p>
                            </div>
                        </div>
                        <div className="bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                                <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-medium">Selesai Dinilai</p>
                                <p className="text-xl font-bold text-slate-800">{submissions.filter(s => s.status === 'graded').length}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-slate-100 p-1 rounded-lg w-full sm:w-auto">
                        <button
                            onClick={() => setFilter("all")}
                            className={`flex-1 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "all" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Semua
                        </button>
                        <button
                            onClick={() => setFilter("pending")}
                            className={`flex-1 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "pending" ? "bg-white text-amber-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Belum Dinilai
                        </button>
                        <button
                            onClick={() => setFilter("graded")}
                            className={`flex-1 sm:px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === "graded" ? "bg-white text-green-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Sudah Dinilai
                        </button>
                    </div>

                    <div className="relative w-full sm:w-64">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama atau NIS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-800 placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Submissions List */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
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
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                                                    {sub.studentName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-slate-900">{sub.studentName}</div>
                                                    <div className="text-sm text-slate-500">{sub.nis}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-slate-900 flex items-center">
                                                <FileText className="w-4 h-4 mr-1.5 text-slate-400" />
                                                {sub.examTitle}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono text-xs">
                                            {formatDateTime(sub.submitTime)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {sub.status === "graded" ? (
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 items-center justify-center gap-1">
                                                    Nilai: {sub.score}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-amber-100 text-amber-800 items-center justify-center gap-1">
                                                    <AlertCircle className="w-3 h-3" /> Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2">
                                                {sub.status === "graded" && (
                                                    <button
                                                        onClick={() => router.push(`/teacher/grade/${sub.id}`)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all"
                                                        title="Edit Nilai"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Hapus pengumpulan dari ${sub.studentName}?`)) {
                                                            deleteSubmission(sub.id);
                                                        }
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                                    title="Hapus Pengumpulan"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/teacher/grade/${sub.id}`)}
                                                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-lg shadow-sm text-white ${sub.status === "graded" ? "bg-slate-600 hover:bg-slate-700" : "bg-indigo-600 hover:bg-indigo-700"
                                                        } transition-colors`}
                                                >
                                                    {sub.status === "graded" ? "Lihat Detail" : "Beri Nilai"}
                                                    <ChevronRight className="ml-1 w-3 h-3" />
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
