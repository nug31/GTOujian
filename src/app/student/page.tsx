"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, Clock, FileText, CheckCircle2, ChevronRight, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/dataStore";

export default function StudentDashboard() {
    const router = useRouter();
    const { exams, fetchExams, submissions, fetchSubmissions, isLoading } = useAppStore();

    useEffect(() => {
        fetchExams();
        fetchSubmissions();
    }, [fetchExams, fetchSubmissions]);

    const [userInfo, setUserInfo] = useState<{ name: string, nisn: string, class: string } | null>(null);

    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) {
            setUserInfo(JSON.parse(info));
        } else {
            router.push("/login");
        }
    }, [router]);

    // Check if user has submitted this exam
    const hasSubmitted = (examId: string) => {
        if (!userInfo) return false;
        return submissions.some(sub => sub.examId === examId && sub.nis === userInfo.nisn);
    };

    // Helper to find score if completed
    const getExamScore = (examId: string) => {
        if (!userInfo) return null;
        const sub = submissions.find(sub => sub.examId === examId && sub.nis === userInfo.nisn);
        return sub && sub.score !== null ? sub.score : 'Pending';
    };

    const handleLogout = () => {
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Wrench className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="font-bold text-xl tracking-tighter text-slate-900 font-outfit">GTO</span>
                            <span className="ml-2 bg-blue-50 text-blue-700 border border-blue-200/60 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Portal Siswa</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-5">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-slate-800">{userInfo?.name || "Memuat..."}</p>
                            <p className="text-xs text-slate-500 font-medium">Peserta Ujian • {userInfo?.class || "..."}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white">
                            {userInfo?.name?.charAt(0) || "S"}
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
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900 font-outfit tracking-tight">Daftar Penugasan Ujian</h1>
                    <p className="text-slate-500 mt-2 text-sm max-w-xl leading-relaxed">
                        Pilih modul ujian praktik yang tersedia, pelajari blueprint yang diberikan, dan kerjakan desain menggunakan terminal CAD Onshape Anda.
                    </p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {isLoading ? (
                        <div className="col-span-full py-16 text-center text-slate-500 flex flex-col items-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                            <p className="font-medium text-sm">Menarik data penugasan dari server...</p>
                        </div>
                    ) : (
                        exams.map((exam, index) => {
                            const submitted = hasSubmitted(exam.id);
                            const isActive = exam.status === "Aktif" && !submitted;

                            return (
                                <motion.div
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    key={exam.id}
                                    className="h-full"
                                >
                                    <div
                                        className={`bg-white rounded-2xl border ${isActive
                                            ? "border-blue-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-xl hover:border-blue-300"
                                            : "border-slate-200 opacity-90 shadow-sm"
                                            } transition-all duration-300 overflow-hidden flex flex-col h-full group relative`}
                                    >
                                        <div className="p-7 flex-grow">
                                            <div className="flex justify-between items-start mb-5">
                                                <h2 className="text-xl font-bold text-slate-900 line-clamp-2 leading-tight font-outfit group-hover:text-blue-700 transition-colors pr-4">{exam.title}</h2>
                                                {submitted || exam.status === "Selesai" ? (
                                                    <span className="flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap shadow-sm">
                                                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Sukses
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60 px-2.5 py-1 rounded-md uppercase tracking-wider whitespace-nowrap shadow-sm">
                                                        Belum Dikerjakan
                                                    </span>
                                                )}
                                            </div>

                                            <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed font-medium">
                                                {exam.description || "Instruksi pengerjaan lebih detail akan ditampilkan setelah Anda memulai ujian."}
                                            </p>

                                            <div className="flex items-center text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 col-span-2 justify-center">
                                                <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                <span>Waktu Pengerjaan: {exam.duration}</span>
                                            </div>
                                        </div>

                                        <div className={`p-5 flex-none ${isActive ? "bg-white border-t border-slate-100" : "bg-slate-50 border-t border-slate-200"}`}>
                                            {isActive ? (
                                                <button
                                                    onClick={() => router.push(`/student/exam/${exam.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3.5 px-4 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] uppercase tracking-wide text-sm border border-blue-500"
                                                >
                                                    Mulai Misi Praktik <ChevronRight className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <div className="flex justify-between items-center w-full px-2 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                                                    <span className="text-slate-500 font-bold justify-center px-4 py-2 uppercase tracking-wide text-[10px]">Predikat Nilai Terakhir</span>
                                                    <div className="px-5 py-2 border-l border-slate-200">
                                                        <span className={`text-xl font-bold tracking-tight font-outfit ${getExamScore(exam.id) === 'Pending' ? 'text-amber-500 text-lg' : 'text-slate-900'}`}>
                                                            {getExamScore(exam.id) || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </main>
        </div>
    );
}
