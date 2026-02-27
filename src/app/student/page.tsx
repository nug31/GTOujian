"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, Clock, FileText, CheckCircle2, ChevronRight, LogOut } from "lucide-react";
import { useAppStore } from "@/lib/dataStore";

export default function StudentDashboard() {
    const router = useRouter();
    const { exams, fetchExams, isLoading } = useAppStore();

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);

    const [userInfo, setUserInfo] = useState<{ name: string, nisn: string, class: string } | null>(null);

    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) {
            setUserInfo(JSON.parse(info));
        } else {
            router.push("/login");
        }
    }, [router]);

    // Helper to find score if completed
    const getExamScore = (examId: string) => {
        // In real app we would check submissions. For demo, we just check status.
        return null;
    };

    const handleLogout = () => {
        router.push("/login");
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Wrench className="w-6 h-6" />
                        <span className="font-bold text-lg tracking-tight text-slate-900">Ujian GTO</span>
                        <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full ml-2">Siswa</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-medium text-slate-900">{userInfo?.name || "Memuat..."}</p>
                            <p className="text-xs text-slate-500">{userInfo?.class || "NIS: ..."}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                            {userInfo?.name?.charAt(0) || "S"}
                        </div>
                        <button
                            onClick={handleLogout}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Daftar Ujian Praktik</h1>
                    <p className="text-slate-500 mt-1">Pilih ujian yang tersedia dan kerjakan menggunakan Onshape.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {isLoading ? (
                        <div className="col-span-full py-12 text-center text-slate-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p>Memuat daftar ujian...</p>
                        </div>
                    ) : (
                        exams.map((exam, index) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                key={exam.id}
                            >
                                <div
                                    className={`bg-white rounded-xl border ${exam.status === "Aktif"
                                        ? "border-blue-200 shadow-sm hover:shadow-md hover:border-blue-300"
                                        : "border-slate-200 opacity-80"
                                        } transition-all overflow-hidden flex flex-col h-full`}
                                >
                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <h2 className="text-lg font-bold text-slate-800 line-clamp-1">{exam.title}</h2>
                                            {exam.status === "Selesai" ? (
                                                <span className="flex items-center text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Selesai
                                                </span>
                                            ) : (
                                                <span className="flex items-center text-xs font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    Tersedia
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-600 mb-6 line-clamp-2">
                                            {exam.description}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 text-sm mb-2">
                                            <div className="flex items-center text-slate-500">
                                                <Clock className="w-4 h-4 mr-2" />
                                                <span>{exam.duration}</span>
                                            </div>
                                            <div className="flex items-center text-slate-500">
                                                <FileText className="w-4 h-4 mr-2" />
                                                <span>Batas: {exam.dueDate.split(',')[0]}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-4 border-t ${exam.status === "Aktif" ? "bg-slate-50 border-blue-100" : "bg-slate-50 border-slate-100"}`}>
                                        {exam.status === "Aktif" ? (
                                            <button
                                                onClick={() => router.push(`/student/exam/${exam.id}`)}
                                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-4 rounded-lg font-medium transition-colors"
                                            >
                                                Mulai Mengerjakan <ChevronRight className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <div className="flex justify-between items-center w-full px-2 py-1">
                                                <span className="text-slate-500 font-medium text-sm">Nilai Akhir</span>
                                                <span className="text-2xl font-bold tracking-tight text-slate-800">{getExamScore(exam.id) || '-'}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
