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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs Navigation */}
                <div className="mb-8 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto hidden-scrollbar">
                        <Link href="/teacher" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-indigo-600 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm tracking-wide">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Data Entitas Siswa</Link>
                    </nav>
                </div>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Manajemen Bank Soal</h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xl">
                            Kelola _blueprint_ ujian praktik, tentukan durasi pengerjaan, dan pantau status soal sebelum diujikan secara serentak.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push("/teacher/exams/new")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] font-bold text-sm flex items-center transition-all uppercase tracking-wide border border-indigo-500 mt-2 md:mt-0"
                    >
                        <Plus className="w-4 h-4 mr-2.5" /> Rakit Soal Baru
                    </button>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex items-center relative z-10 w-full sm:w-96 group">
                    <div className="relative w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input
                            type="text"
                            placeholder="Temukan soal berdasarkan judul..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 group-focus-within:bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm text-slate-900 transition-all outline-none shadow-inner group-focus-within:shadow-none placeholder-slate-400"
                        />
                    </div>
                </div>

                {/* Exams List */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {isLoading ? (
                        <div className="col-span-full py-16 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                            <p className="font-medium text-sm">Menarik daftar bank soal...</p>
                        </div>
                    ) : filteredExams.length > 0 ? (
                        filteredExams.map((exam, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                key={exam.id}
                                className="h-full"
                            >
                                <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-xl hover:border-indigo-200/60 transition-all flex flex-col h-full overflow-hidden group">
                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-100/50">
                                                <FileText className="w-4 h-4 mr-2" /> Paket Soal Praktik
                                            </div>
                                            <span className={`text-[10px] px-2.5 py-1 rounded-md font-bold uppercase tracking-wider border shadow-sm ${exam.status === "Aktif" ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                                }`}>
                                                {exam.status}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 mb-2.5 line-clamp-2 leading-tight font-outfit group-hover:text-indigo-700 transition-colors">{exam.title}</h3>
                                        <p className="text-slate-500 text-sm mb-6 line-clamp-3 leading-relaxed">{exam.description || "Tidak ada deksripsi khusus untuk paket soal ini."}</p>

                                        <div className="text-xs text-slate-600 space-y-2.5 font-medium border-t border-slate-100 pt-4 mt-auto">
                                            <div className="flex items-center"><span className="w-20 text-slate-400">Durasi:</span> <span className="font-bold text-slate-800">{exam.duration}</span></div>
                                            <div className="flex items-center"><span className="w-20 text-slate-400">Tenggat Selesai:</span> <span className="font-bold text-slate-800">{exam.dueDate}</span></div>
                                            <div className="flex items-center"><span className="w-20 text-slate-400">Kode Hash:</span> <span className="font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[10px] uppercase border border-slate-200">{exam.id.split('-')[0]}</span></div>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 flex gap-2.5 items-center justify-between">
                                        {exam.status === "Aktif" && (
                                            <button
                                                onClick={() => router.push(`/teacher/exams/${exam.id}/monitor`)}
                                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center flex-1 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] uppercase tracking-wide border border-indigo-500"
                                            >
                                                Live Monitor Radar
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/teacher/exams/${exam.id}/edit`)}
                                            className={`${exam.status === "Aktif" ? "flex-none px-3" : "flex-1"} bg-slate-100 border border-slate-200 hover:bg-white hover:border-indigo-300 hover:text-indigo-600 hover:shadow-sm text-slate-600 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center`}
                                        >
                                            <Edit2 className="w-4 h-4" /> {exam.status !== "Aktif" && <span className="ml-2 uppercase tracking-wide">Edit Komponen Induk</span>}
                                        </button>
                                        <button
                                            onClick={() => handleDelete(exam.id)}
                                            className="bg-slate-100 border border-slate-200 hover:border-red-300 hover:text-red-600 hover:bg-red-50 text-slate-400 hover:shadow-sm px-3 py-2.5 rounded-xl transition-all flex items-center justify-center flex-none"
                                            title="Bakar Payload Ujian"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 bg-white border-2 border-slate-200 rounded-2xl border-dashed">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300 border border-slate-200">
                                <FileText className="w-8 h-8" />
                            </div>
                            <p className="font-bold text-lg text-slate-700 mb-1">Pustaka Kosong</p>
                            <p className="text-sm">Anda belum merakit satupun soal materi ujian GTO.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
