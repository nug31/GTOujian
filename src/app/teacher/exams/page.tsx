"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, LogOut, FileText, Search, Plus, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAppStore } from "@/lib/dataStore";

export default function TeacherExamsDashboard() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [teacherName, setTeacherName] = useState("Guru GTO");
    const { exams, deleteExam, fetchExams, isLoading } = useAppStore();

    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) {
            const parsed = JSON.parse(info);
            if (parsed.role === "teacher") setTeacherName(parsed.name);
        }
        fetchExams();
    }, [fetchExams]);

    const handleDelete = async (id: string) => {
        if (window.confirm("Apakah Anda yakin ingin menghapus soal ujian ini?")) {
            await deleteExam(id);
        }
    };

    const handleLogout = () => {
        router.push("/login");
    };

    const filteredExams = exams.filter((exam) => {
        return exam.title.toLowerCase().includes(searchQuery.toLowerCase());
    });

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
                        <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                            AR
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
                        <Link href="/teacher" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-indigo-500 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm">Data Siswa</Link>
                    </nav>
                </div>

                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Manajemen Bank Soal</h1>
                        <p className="text-slate-500 mt-1">Kelola dan buat soal ujian praktik gambar teknik yang baru.</p>
                    </div>
                    <button
                        onClick={() => router.push("/teacher/exams/new")}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg shadow-sm font-medium text-sm flex items-center transition-colors"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Buat Soal Baru
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex justify-between items-center">
                    <div className="relative w-full sm:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari judul soal..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-slate-800 placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Exams List */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                            <p>Memuat bank soal...</p>
                        </div>
                    ) : filteredExams.length > 0 ? (
                        filteredExams.map((exam, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={exam.id}
                            >
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full overflow-hidden">
                                    <div className="p-5 flex-grow">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-xs font-semibold mb-2">
                                                <FileText className="w-3.5 h-3.5 mr-1.5" /> Soal Praktik
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${exam.status === "Aktif" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"
                                                }`}>
                                                {exam.status}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 mb-2 line-clamp-1">{exam.title}</h3>
                                        <p className="text-slate-600 text-sm mb-4 line-clamp-2">{exam.description}</p>

                                        <div className="text-xs text-slate-500 space-y-1.5">
                                            <div className="flex items-center"><span className="w-16 font-medium text-slate-700">Durasi:</span> {exam.duration}</div>
                                            <div className="flex items-center"><span className="w-16 font-medium text-slate-700">Tenggat:</span> {exam.dueDate}</div>
                                            <div className="flex items-center"><span className="w-16 font-medium text-slate-700">Kode:</span> <span className="font-mono bg-slate-100 px-1 rounded">{exam.id}</span></div>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 bg-slate-50 p-3 flex gap-2">
                                        {exam.status === "Aktif" && (
                                            <button
                                                onClick={() => router.push(`/teacher/exams/${exam.id}/monitor`)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center flex-1 shadow-sm"
                                            >
                                                Live Monitor
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
                                            className={`${exam.status === "Aktif" ? "flex-none" : "flex-1"} bg-white border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center`}
                                        >
                                            <Edit2 className="w-4 h-4" /> {exam.status !== "Aktif" && "Edit"}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(exam.id)}
                                            className="bg-white border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 text-slate-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                                            title="Hapus Soal"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl border-dashed">
                            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p>Tidak ada soal yang ditemukan.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
