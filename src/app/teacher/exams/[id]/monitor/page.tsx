"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, AlertCircle, Send, Loader2, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/lib/dataStore";
import { supabase } from "@/lib/supabase";

interface ActiveStudent {
    nisn: string;
    name: string;
    class: string;
    onlineAt: string;
}

export default function ExamMonitorPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { exams, fetchExams } = useAppStore();
    const exam = exams.find(e => e.id === params.id);

    const [activeStudents, setActiveStudents] = useState<ActiveStudent[]>([]);
    const [searchQuery, setSearchQuery] = useState("");

    // Warning Modal State
    const [isWarningModalOpen, setIsWarningModalOpen] = useState(false);
    const [warningTarget, setWarningTarget] = useState<{ nisn: string, name: string } | null>(null); // null means broadcast to ALL
    const [warningMessage, setWarningMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    // Supabase Channel Reference
    const [channel, setChannel] = useState<any>(null);

    useEffect(() => {
        if (exams.length === 0) fetchExams();
    }, [exams, fetchExams]);

    useEffect(() => {
        if (!exam) return;

        const roomName = `exam-${exam.id}`;
        const newChannel = supabase.channel(roomName);

        newChannel
            .on('presence', { event: 'sync' }, () => {
                const newState = newChannel.presenceState();
                console.log("Sync Presence:", newState);
                const students: ActiveStudent[] = [];

                for (const key in newState) {
                    const presenceData = newState[key][0] as any;
                    if (presenceData && presenceData.nisn) {
                        students.push({
                            nisn: presenceData.nisn,
                            name: presenceData.name,
                            class: presenceData.class,
                            onlineAt: presenceData.onlineAt || new Date().toISOString()
                        });
                    }
                }

                students.sort((a, b) => a.name.localeCompare(b.name));
                setActiveStudents(students);
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                console.log('Join Presence:', key, newPresences);
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                console.log('Leave Presence:', key, leftPresences);
            })
            .subscribe(async (status, err) => {
                console.log("Monitor channel status:", status, err);
                if (status === 'SUBSCRIBED') {
                    console.log("Connected to monitor channel:", roomName);
                }
            });

        setChannel(newChannel);

        return () => {
            newChannel.unsubscribe();
        };
    }, [exam]);

    const handleSendWarning = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!channel || !warningMessage.trim()) return;

        setIsSending(true);

        try {
            await channel.send({
                type: 'broadcast',
                event: 'warning',
                payload: {
                    message: warningMessage.trim(),
                    targetNisn: warningTarget ? warningTarget.nisn : null // null = all active
                }
            });

            // Reset after sending
            setTimeout(() => {
                setIsSending(false);
                setIsWarningModalOpen(false);
                setWarningMessage("");
                setWarningTarget(null);
            }, 500);

        } catch (error) {
            console.error("Failed to send warning:", error);
            alert("Gagal mengirim peringatan.");
            setIsSending(false);
        }
    };

    const openWarningModal = (student?: ActiveStudent) => {
        if (student) {
            setWarningTarget({ nisn: student.nisn, name: student.name });
        } else {
            setWarningTarget(null); // All
        }
        setWarningMessage("");
        setIsWarningModalOpen(true);
    };

    const filteredStudents = activeStudents.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.nisn.includes(searchQuery)
    );

    if (!exam) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-8">
            <div className="w-full max-w-5xl px-4 sm:px-6">

                {/* Header */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.back()}
                                className="p-2 -ml-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                    Live Monitor <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>
                                </h1>
                                <p className="text-sm text-slate-500 mt-1">{exam.title}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-indigo-100">
                                <Users className="w-4 h-4" />
                                {activeStudents.length} Siswa Aktif
                            </div>
                            <button
                                onClick={() => openWarningModal()}
                                disabled={activeStudents.length === 0}
                                className="bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <AlertCircle className="w-4 h-4" />
                                Peringatkan Semua
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative mb-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Cari nama atau NISN siswa yang sedang aktif..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                    />
                </div>

                {/* Active Students Grid */}
                {activeStudents.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">Belum Ada Siswa Aktif</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">Siswa akan otomatis muncul di sini secara real-time saat mereka memulai ujian di perangkat mereka.</p>
                    </div>
                ) : filteredStudents.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        Tidak ada siswa yang cocok dengan pencarian "{searchQuery}"
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <AnimatePresence>
                            {filteredStudents.map((student) => (
                                <motion.div
                                    key={student.nisn}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white border text-left border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
                                >
                                    <div className="absolute top-0 right-0 p-3">
                                        <span className="flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                        </span>
                                    </div>
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg flex-shrink-0">
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 text-sm line-clamp-1 pr-4">{student.name}</h3>
                                            <p className="text-xs text-slate-500 font-mono">{student.nisn}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">
                                            Online dari {new Date(student.onlineAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <button
                                            onClick={() => openWarningModal(student)}
                                            className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors border border-red-100"
                                        >
                                            Peringatkan
                                        </button>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}

            </div>

            {/* ===== WARNING MODAL ===== */}
            <AnimatePresence>
                {isWarningModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden"
                        >
                            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-red-50">
                                <div className="flex items-center gap-2 text-red-700">
                                    <AlertCircle className="w-5 h-5" />
                                    <h3 className="font-bold">Kirim Peringatan</h3>
                                </div>
                                <button
                                    onClick={() => setIsWarningModalOpen(false)}
                                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={handleSendWarning} className="p-6">
                                <div className="mb-4">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Target</label>
                                    <div className="text-sm bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                                        {warningTarget ? (
                                            <span className="font-medium text-slate-900">{warningTarget.name} <span className="text-slate-500 font-mono text-xs">({warningTarget.nisn})</span></span>
                                        ) : (
                                            <span className="font-bold text-red-600 flex items-center gap-2"><Users className="w-4 h-4" /> SEMUA SISWA AKTIF ({activeStudents.length})</span>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Pesan Peringatan</label>
                                    <textarea
                                        required
                                        rows={3}
                                        value={warningMessage}
                                        onChange={(e) => setWarningMessage(e.target.value)}
                                        placeholder="Pesan akan muncul tebal di layar siswa..."
                                        className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none shadow-sm"
                                        autoFocus
                                    />
                                    <div className="flex gap-2 mt-2">
                                        <button type="button" onClick={() => setWarningMessage("Mohon kerjakan secara mandiri dan jangan melihat tab lain!")} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors border border-slate-200">Preset: Jangan Nyotek</button>
                                        <button type="button" onClick={() => setWarningMessage("Waktu ujian akan segera habis, segera selesaikan pekerjaan Onshape Anda.")} className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-1 rounded transition-colors border border-slate-200">Preset: Waktu Habis</button>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsWarningModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSending || !warningMessage.trim()}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center gap-2"
                                    >
                                        {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                        Kirim Sekarang
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}
