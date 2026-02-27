"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, Clock, Info, Link as LinkIcon, AlertCircle, CheckCircle2, Copy, ShieldAlert, BookOpen, ExternalLink, X } from "lucide-react";
import { useAppStore } from "@/lib/dataStore";
import { supabase } from "@/lib/supabase";

export default function ExamPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { exams, addSubmission, fetchExams } = useAppStore();
    const exam = exams.find(e => e.id === params.id);
    const [userInfo, setUserInfo] = useState<{ name: string, nisn: string, class: string } | null>(null);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        setIsAndroid(/Android/i.test(navigator.userAgent));
    }, []);

    // Exam state
    const [examStarted, setExamStarted] = useState(false);
    const [agreedToRules, setAgreedToRules] = useState(false);

    // Live Monitoring State
    const [liveWarning, setLiveWarning] = useState<string | null>(null);

    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) setUserInfo(JSON.parse(info));

        if (!exam) {
            fetchExams();
        }
    }, [exam, fetchExams]);

    const [timeLeft, setTimeLeft] = useState(7200);
    const [onshapeLink, setOnshapeLink] = useState("");
    const [submitted, setSubmitted] = useState(false);

    // Set duration and handle persistence
    useEffect(() => {
        if (exam) {
            let totalSeconds = 7200; // Default 2 hours
            const durationStr = exam.duration.toLowerCase();
            const num = parseInt(durationStr.replace(/[^0-9]/g, '')) || 120; // Extract number

            if (durationStr.includes('jam')) {
                totalSeconds = num * 3600; // e.g. "2 Jam" -> 7200 sec
            } else if (durationStr.includes('menit')) {
                totalSeconds = num * 60; // e.g. "120 Menit" -> 7200 sec
            } else {
                totalSeconds = num * 60; // Fallback to minutes
            }

            const startTimeKey = `exam_start_${params.id}`;
            const storedStartTime = localStorage.getItem(startTimeKey);

            if (storedStartTime) {
                const startTime = parseInt(storedStartTime);
                const now = Date.now();
                const elapsedSeconds = Math.floor((now - startTime) / 1000);
                const remaining = totalSeconds - elapsedSeconds;

                if (remaining > 0) {
                    setTimeLeft(remaining);
                    setExamStarted(true);
                } else {
                    setTimeLeft(0);
                    setExamStarted(true);
                    // Optionally handle auto-submit here if time passed while away
                }
            } else {
                setTimeLeft(totalSeconds);
            }
        }
    }, [exam, params.id]);

    // Timer — only runs after exam started
    useEffect(() => {
        if (!examStarted || timeLeft <= 0 || submitted) return;
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [examStarted, timeLeft, submitted]);

    // Anti-navigation: warn on refresh/close
    useEffect(() => {
        if (!examStarted || submitted) return;
        const handler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handler);
        return () => window.removeEventListener('beforeunload', handler);
    }, [examStarted, submitted]);

    // Supabase Realtime: Presence & Broadcast
    useEffect(() => {
        if (!examStarted || submitted || !userInfo || !exam) return;

        const roomName = `exam-${exam.id}`;
        console.log("Joining Presence Room:", roomName);

        const channel = supabase.channel(roomName, {
            config: {
                presence: {
                    key: userInfo.nisn,
                },
            },
        });

        // 1. Listen for Broadcast Warnings from Teacher
        channel.on(
            'broadcast',
            { event: 'warning' },
            (payload) => {
                // If the message is for everyone, or specifically for this student
                if (!payload.payload.targetNisn || payload.payload.targetNisn === userInfo.nisn) {
                    setLiveWarning(payload.payload.message);
                }
            }
        );

        // 2. Subscribe and track presence
        channel.subscribe(async (status, err) => {
            console.log("Student Realtime Status:", status, err);
            if (status === 'SUBSCRIBED') {
                const trackRes = await channel.track({
                    name: userInfo.name,
                    nisn: userInfo.nisn,
                    class: userInfo.class,
                    onlineAt: new Date().toISOString(),
                });
                console.log("Student Presence Tracked:", trackRes);
            }
        });

        return () => {
            console.log("Leaving Presence Room:", roomName);
            channel.unsubscribe();
        };
    }, [examStarted, submitted, userInfo?.nisn, exam?.id]);

    // Disable right-click and common cheat shortcuts on exam page
    useEffect(() => {
        if (!examStarted || submitted) return;
        const handleContextMenu = (e: MouseEvent) => e.preventDefault();
        const handleKeyDown = (e: KeyboardEvent) => {
            if (
                e.key === 'F12' ||
                (e.ctrlKey && e.shiftKey && ['i', 'I', 'j', 'J', 'c', 'C'].includes(e.key)) ||
                (e.ctrlKey && ['u', 'U'].includes(e.key))
            ) {
                e.preventDefault();
            }
        };
        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [examStarted, submitted]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const isLowTime = timeLeft < 600;

    const handleStartExam = () => {
        if (!agreedToRules) return;

        // Persist start time
        const startTimeKey = `exam_start_${params.id}`;
        localStorage.setItem(startTimeKey, Date.now().toString());

        setExamStarted(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!onshapeLink.includes("onshape.com")) {
            alert("Masukkan link dokumen Onshape yang valid.");
            return;
        }

        if (exam && userInfo) {
            await addSubmission({
                studentName: userInfo.name,
                nis: userInfo.nisn,
                examId: exam.id,
                examTitle: exam.title,
                submitTime: new Date().toLocaleString(),
                status: 'pending',
                score: null,
                onshapeLink: onshapeLink,
                isLate: timeLeft <= 0
            });

            // Cleanup persistence
            localStorage.removeItem(`exam_start_${params.id}`);
        }

        setSubmitted(true);
        setTimeout(() => {
            router.push("/student");
        }, 3000);
    };

    if (!exam) return <div className="p-10 text-center">Soal tidak ditemukan.</div>;

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col lg:h-screen lg:max-h-screen lg:overflow-hidden relative text-slate-200">
            {/* Dark background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-blue-600/5 rounded-full blur-3xl" />
            </div>

            {/* ===== LIVE WARNING OVERLAY ===== */}
            <AnimatePresence>
                {liveWarning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-red-950/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-red-500"
                        >
                            <div className="bg-red-600 px-6 py-4 flex items-center gap-3">
                                <AlertCircle className="w-8 h-8 text-white" />
                                <h2 className="text-xl font-bold text-white tracking-wide">Pesan Dari Guru</h2>
                            </div>
                            <div className="p-6">
                                <p className="text-slate-800 text-lg font-medium leading-relaxed mb-8">
                                    "{liveWarning}"
                                </p>
                                <button
                                    onClick={() => setLiveWarning(null)}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-colors"
                                >
                                    Saya Mengerti
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== PRE-EXAM RULES OVERLAY ===== */}
            <AnimatePresence>
                {!examStarted && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-slate-950/95 flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto hidden-scrollbar relative"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-800 to-slate-900 border-b border-slate-800 px-6 py-5">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-9 h-9 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white tracking-wide">Peraturan Ujian</h2>
                                </div>
                                <p className="text-slate-400 text-sm ml-12">Panduan kewajiban bagi seluruh peserta ujian</p>
                            </div>

                            {/* Exam info badge */}
                            <div className="px-6 pt-5">
                                <div className="glass-dark border border-indigo-500/30 rounded-xl px-4 py-3 flex items-start gap-3 relative overflow-hidden">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                                    <BookOpen className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-white text-sm tracking-wide">{exam.title}</p>
                                        <p className="text-indigo-200/70 text-xs mt-1">Durasi Ujian: <span className="text-indigo-300 font-medium">{exam.duration}</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* Rules */}
                            <div className="px-6 pt-5 pb-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Kode Etik Ujian</p>
                                <ul className="space-y-3.5">
                                    {[
                                        "Kerjakan soal secara mandiri tanpa bantuan eksternal.",
                                        "Buka lembar kerja Onshape di tab baru secara terpisah.",
                                        "Dilarang beralih ke website lain selain dokumen Onshape.",
                                        "Dilarang menutup atau me-refresh halaman penjagaan ini.",
                                        "Lampirkan link dokumen jawaban Anda sebelum timer habis.",
                                        "Pelanggaran sistem akan otomatis tercatat sebagai diskualifikasi.",
                                    ].map((rule, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                            <span className="w-6 h-6 bg-slate-800 border border-slate-700 rounded-full text-[10px] font-bold text-slate-400 flex items-center justify-center flex-shrink-0 shadow-sm">{i + 1}</span>
                                            <span className="mt-0.5 leading-relaxed">{rule}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Warning box */}
                            <div className="px-6 pt-4 pb-4">
                                <div className="bg-red-950/30 border border-red-900/50 rounded-lg px-4 py-3.5 flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-200/90 leading-relaxed font-outfit">
                                        Setelah Anda menekan <strong>Mulai Mengerjakan</strong>, timer siber akan bergulir dan browser akan mengunci aktivitas navigasi Anda.
                                    </p>
                                </div>
                            </div>

                            {/* Checkbox + Button */}
                            <div className="px-6 pb-6 space-y-5">
                                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700/50">
                                    <input
                                        type="checkbox"
                                        checked={agreedToRules}
                                        onChange={(e) => setAgreedToRules(e.target.checked)}
                                        className="w-4 h-4 accent-indigo-500 cursor-pointer mt-0.5"
                                    />
                                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                                        Saya bersumpah mematuhi seluruh kode etik ujian ini dan menerima konsekuensinya apabila terbukti melanggar.
                                    </span>
                                </label>

                                <button
                                    onClick={handleStartExam}
                                    disabled={!agreedToRules}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-700 disabled:cursor-not-allowed border border-indigo-500 text-white font-bold tracking-wide py-3.5 px-4 rounded-xl shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] transition-all uppercase text-sm font-outfit"
                                >
                                    Mulai Mengerjakan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== EXAM HEADER ===== */}
            <header className="glass-dark border-b border-slate-800/50 text-white flex-shrink-0 z-10 sticky top-0">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-slate-800 rounded-lg flex items-center justify-center border border-slate-700 shadow-inner">
                            <Wrench className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="font-extrabold text-2xl tracking-tighter font-outfit bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
                            GTO
                        </span>
                        <div className="h-5 w-px bg-slate-700" />
                        <span className="text-slate-400 text-xs font-mono tracking-wider hidden sm:inline-block">ID: {params.id.split('-')[0]}</span>
                    </div>

                    <div className={`flex items-center gap-2.5 px-5 py-1.5 rounded-full border shadow-inner ${isLowTime ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/10 animate-pulse' : 'bg-slate-900/60 text-slate-200 border-slate-700/50 shadow-black/20'
                        }`}>
                        <Clock className="w-4 h-4" />
                        <span className="font-mono font-medium text-lg tracking-widest">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            {/* ===== MAIN SPLIT VIEW ===== */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden z-10">
                {/* Left pane: Blueprint Display (Floating style) */}
                <div className="flex-1 flex flex-col p-4 lg:p-6 lg:border-r border-slate-800/60 overflow-y-auto min-h-[600px] lg:min-h-0">
                    <div className="mb-4">
                        <h1 className="text-2xl font-bold text-white mb-1.5 font-outfit tracking-wide">{exam.title}</h1>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                            {exam.description}
                        </p>
                    </div>

                    <div className="flex-1 w-full h-full flex items-center justify-center pt-2">
                        {/* Blueprint Container */}
                        <div className="relative w-full h-full glass-dark rounded-2xl p-3 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
                            <div className="flex items-center justify-between px-2 pb-3 pt-1 border-b border-slate-700/50 mb-3">
                                <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                    Live Blueprint Viewer
                                </span>
                                <span className="text-xs text-slate-500 font-mono">Render: {exam.imageUrl ? 'Active' : 'Missing'}</span>
                            </div>

                            <div className="relative flex-1 bg-[#ffffff] rounded-xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-700">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={exam.imageUrl || "/image.png"}
                                    alt={`Blueprint Soal ${exam.title}`}
                                    className="w-full h-full object-contain mix-blend-multiply"
                                    style={{ filter: 'contrast(1.05) brightness(0.98)' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right pane: Submission Form (Glass pane) */}
                <div className="w-full lg:w-[480px] glass-dark border-l-0 lg:border-l border-slate-700/50 flex flex-col overflow-y-auto hidden-scrollbar z-10 shadow-2xl">
                    <div className="p-6 md:p-8">
                        {!submitted ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-8">
                                    <h2 className="text-xl font-bold text-white mb-2 font-outfit">Lembar Pengumpulan</h2>
                                    <p className="text-slate-400 text-sm leading-relaxed">Pintu terakhir mesin penjawab. Tautkan cetak biru hasil rancangan 3D Anda di sini.</p>
                                </div>

                                <div className="bg-blue-900/20 border border-blue-500/20 rounded-xl p-5 mb-8 backdrop-blur-md">
                                    <h3 className="flex items-center text-sm font-semibold text-blue-300 mb-3 tracking-wide">
                                        <Info className="w-4 h-4 mr-2" /> Instruksi Pengiriman
                                    </h3>
                                    <ol className="list-decimal list-inside text-sm text-blue-100/80 space-y-2.5 ml-1 marker:text-blue-500">
                                        <li>Buka platform <strong>Onshape</strong> di lingkungan kerja baru.</li>
                                        <li>Lakukan perakitan 3D berdasarkan blueprint teknis.</li>
                                        <li>Tekan <strong>Share</strong> / Bagikan pada menu atas.</li>
                                        <li>Pastikan mode <strong>Link Sharing</strong> diaktifkan.</li>
                                        <li>Injeksi link publik ke dalam modul form di bawah.</li>
                                    </ol>
                                    <div className="mt-5 flex">
                                        <a
                                            href={isAndroid ? "intent://cad.onshape.com#Intent;scheme=https;package=com.onshape.app;end" : "https://cad.onshape.com"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-blue-600/20 text-blue-300 border border-blue-500/30 px-4 py-2 rounded-lg font-medium hover:bg-blue-600/40 hover:text-white transition-all flex items-center shadow-[0_0_10px_rgba(59,130,246,0.1)]"
                                        >
                                            {isAndroid ? "Jalankan Aplikasi Onshape" : "Akses Ruang Onshape"} <ExternalLink className="ml-2 w-3.5 h-3.5" />
                                        </a>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-auto pt-4 border-t border-slate-800">
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-slate-300 mb-2">
                                            Tautan (Link) Dokumen Onshape
                                        </label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LinkIcon className="h-5 w-5 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
                                            </div>
                                            <input
                                                type="url"
                                                required
                                                value={onshapeLink}
                                                onChange={(e) => setOnshapeLink(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 text-sm transition-all text-white placeholder-slate-600 outline-none"
                                                placeholder="https://cad.onshape.com/documents/..."
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-amber-950/20 rounded-lg p-3.5 flex items-start mb-6 border border-amber-500/20">
                                        <AlertCircle className="w-4 h-4 text-amber-500 mr-2.5 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-200/80 leading-relaxed">Sistem tidak dapat menilai tautan privat. Pastikan mode pembagian publik telah diaktifkan, atau risiko pengurangan poin berlaku.</p>
                                    </div>

                                    {timeLeft <= 0 && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-red-950/30 rounded-lg p-3.5 flex items-start mb-6 border border-red-500/30">
                                            <AlertCircle className="w-4 h-4 text-red-400 mr-2.5 mt-0.5 flex-shrink-0" />
                                            <p className="text-xs text-red-200/90 font-medium leading-relaxed">Timer komputasi telah mendatar nol. Penyerahan pada titik ini akan dicatat dalam database sebagai [LATE SUBMISSION].</p>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        className={`w-full text-white font-bold tracking-wide uppercase text-sm py-4 px-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 font-outfit ${timeLeft <= 0 ? 'bg-red-600 hover:bg-red-500 shadow-red-900/50' : 'bg-blue-600 hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-500'}`}
                                    >
                                        {timeLeft <= 0 ? "Bypass & Kumpulkan Paksa" : "Kirim Jawaban Ke Server"}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center py-12"
                            >
                                <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h2 className="text-3xl font-bold text-white mb-3 font-outfit tracking-wide">Transmisi Sukses</h2>
                                <p className="text-slate-400 mb-8 max-w-[280px] leading-relaxed">
                                    Data ujian berhasil dienkripsi dan dikirim ke server inti. Memutus sambungan...
                                </p>
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
