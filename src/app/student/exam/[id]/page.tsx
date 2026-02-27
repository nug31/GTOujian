"use client";

import { useState, useEffect, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Clock, Info, Link as LinkIcon, AlertCircle, CheckCircle2, Copy, ShieldAlert, BookOpen, ExternalLink } from "lucide-react";
import { useAppStore } from "@/lib/dataStore";

export default function ExamPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { exams, addSubmission, fetchExams } = useAppStore();
    const exam = exams.find(e => e.id === params.id);
    const [userInfo, setUserInfo] = useState<{ name: string, nisn: string, class: string } | null>(null);

    // Exam state
    const [examStarted, setExamStarted] = useState(false);
    const [agreedToRules, setAgreedToRules] = useState(false);

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

    // Set duration from exam data
    useEffect(() => {
        if (exam) {
            const minutes = parseInt(exam.duration.split(' ')[0]) || 120;
            setTimeLeft(minutes * 60);
        }
    }, [exam]);

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
                onshapeLink: onshapeLink
            });
        }

        setSubmitted(true);
        setTimeout(() => {
            router.push("/student");
        }, 3000);
    };

    if (!exam) return <div className="p-10 text-center">Soal tidak ditemukan.</div>;

    return (
        <div className="min-h-screen bg-slate-100 flex flex-col h-screen max-h-screen overflow-hidden">

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
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
                        >
                            {/* Header */}
                            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-5">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-9 h-9 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                        <ShieldAlert className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <h2 className="text-lg font-bold text-white">Peraturan Ujian</h2>
                                </div>
                                <p className="text-slate-400 text-sm ml-12">Baca seluruh peraturan sebelum memulai</p>
                            </div>

                            {/* Exam info badge */}
                            <div className="px-6 pt-5">
                                <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 flex items-start gap-3">
                                    <BookOpen className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold text-slate-800 text-sm">{exam.title}</p>
                                        <p className="text-slate-500 text-xs mt-0.5">Durasi: {exam.duration} &nbsp;|&nbsp; Waktu Timer dimulai setelah kamu klik Mulai</p>
                                    </div>
                                </div>
                            </div>

                            {/* Rules */}
                            <div className="px-6 pt-4 pb-2">
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Peraturan yang harus dipatuhi</p>
                                <ul className="space-y-2.5">
                                    {[
                                        "Kerjakan soal secara mandiri dan jujur tanpa bantuan orang lain.",
                                        "Buka Onshape di tab baru — jangan tutup halaman ujian ini.",
                                        "Dilarang membuka website lain selain Onshape selama ujian.",
                                        "Jangan refresh atau tutup halaman ini — pekerjaan bisa hilang.",
                                        "Kumpulkan link Onshape sebelum waktu habis.",
                                        "Pelanggaran aturan dapat mengakibatkan pengurangan nilai atau diskualifikasi.",
                                    ].map((rule, i) => (
                                        <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700">
                                            <span className="w-5 h-5 bg-slate-100 rounded-full text-xs font-bold text-slate-500 flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                                            {rule}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Warning box */}
                            <div className="px-6 pt-3 pb-4">
                                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-start gap-2.5">
                                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-red-700 leading-relaxed">
                                        Setelah kamu klik <strong>Mulai Mengerjakan</strong>, timer akan berjalan dan browser akan memperingatkan jika kamu mencoba menutup atau meninggalkan halaman ini.
                                    </p>
                                </div>
                            </div>

                            {/* Checkbox + Button */}
                            <div className="px-6 pb-6 space-y-4">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={agreedToRules}
                                        onChange={(e) => setAgreedToRules(e.target.checked)}
                                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                                    />
                                    <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">
                                        Saya telah membaca dan menyetujui seluruh peraturan ujian di atas.
                                    </span>
                                </label>

                                <button
                                    onClick={handleStartExam}
                                    disabled={!agreedToRules}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all"
                                >
                                    Mulai Mengerjakan
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ===== EXAM HEADER ===== */}
            <header className="bg-slate-900 border-b border-slate-800 text-white flex-shrink-0">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="font-bold text-lg tracking-tight">Ujian GTO</span>
                        <div className="h-4 w-px bg-slate-700" />
                        <span className="text-slate-300 text-sm">Exam ID: {params.id}</span>
                    </div>

                    <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${isLowTime ? 'bg-red-500/10 text-red-400 border-red-500/20 animate-pulse' : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                        <Clock className="w-5 h-5" />
                        <span className="font-mono font-medium text-lg tracking-wider">{formatTime(timeLeft)}</span>
                    </div>
                </div>
            </header>

            {/* ===== MAIN SPLIT VIEW ===== */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left pane: Blueprint */}
                <div className="flex-1 bg-slate-800 flex flex-col p-4 border-r border-slate-700 overflow-y-auto">
                    <div className="bg-slate-900 rounded-xl p-4 mb-4 border border-slate-700 flex-shrink-0">
                        <h1 className="text-xl font-bold text-white mb-2">{exam.title}</h1>
                        <p className="text-slate-400 text-sm">
                            {exam.description}
                        </p>
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 relative overflow-hidden flex flex-col items-center justify-center p-8 group">
                        {/* Grid background */}
                        <div className="absolute inset-0 z-0 bg-slate-800 flex items-center justify-center -space-y-4 opacity-50">
                            <div className="w-full h-full" style={{ backgroundImage: 'linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
                        </div>

                        <div className="z-10 w-full h-full flex flex-col items-center justify-center p-2">
                            <div className="relative w-full h-full bg-white rounded-lg shadow-xl overflow-hidden border-4 border-slate-600 flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={exam.imageUrl || "/image.png"}
                                    alt={`Blueprint Soal ${exam.title}`}
                                    className="w-full h-full object-contain bg-white"
                                />
                            </div>
                            <p className="text-slate-400 font-mono text-xs mt-2 bg-slate-800/80 px-3 py-1 rounded-full flex-shrink-0">BLUEPRINT SOAL</p>
                        </div>
                    </div>
                </div>

                {/* Right pane: Submission Form */}
                <div className="w-full lg:w-[450px] bg-white flex flex-col overflow-y-auto hidden-scrollbar">
                    <div className="p-6">
                        {!submitted ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex flex-col h-full"
                            >
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-slate-900 mb-1">Pengumpulan Hasil Ujian</h2>
                                    <p className="text-slate-500 text-sm">Masuk ke Onshape, gambar desainmu, pastikan link di-set ke &quot;Public&quot; atau &quot;Link Sharing&quot;, lalu tempel URL-nya di bawah ini.</p>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                                    <h3 className="flex items-center text-sm font-semibold text-blue-800 mb-2">
                                        <Info className="w-4 h-4 mr-2" /> Langkah-langkah
                                    </h3>
                                    <ol className="list-decimal list-inside text-sm text-blue-700 space-y-2 ml-1">
                                        <li>Buka tab baru dan login ke akun <strong>Onshape</strong> Anda.</li>
                                        <li>Selesaikan gambar 3D sesuai instruksi di samping.</li>
                                        <li>Klik tombol biru <strong>&quot;Share&quot;</strong> di kanan atas Onshape.</li>
                                        <li>Pilih tab <strong>&quot;Link Sharing&quot;</strong> &amp; aktifkan.</li>
                                        <li>Copy link dan paste ke kolom di bawah ini.</li>
                                    </ol>
                                    <div className="mt-4 flex">
                                        <a
                                            href="https://cad.onshape.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs bg-white text-blue-600 border border-blue-200 px-3 py-1.5 rounded-md font-medium hover:bg-blue-50 transition-colors flex items-center"
                                        >
                                            Buka Onshape <ExternalLink className="ml-1.5 w-3 h-3" />
                                        </a>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="mt-auto pt-4 border-t border-slate-100">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-700 mb-2">
                                            Tautan (Link) Onshape
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <LinkIcon className="h-5 w-5 text-slate-400" />
                                            </div>
                                            <input
                                                type="url"
                                                required
                                                value={onshapeLink}
                                                onChange={(e) => setOnshapeLink(e.target.value)}
                                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors text-slate-900"
                                                placeholder="https://cad.onshape.com/documents/..."
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-amber-50 rounded-lg p-3 flex items-start mb-6 border border-amber-100">
                                        <AlertCircle className="w-4 h-4 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-amber-700">Pastikan link dapat diakses oleh siapa saja yang memiliki link (Link Sharing aktif). Jika guru tidak bisa membukanya, nilai bisa dikurangi.</p>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        Kumpulkan Jawaban
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center py-12"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-6">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Berhasil Terkirim!</h2>
                                <p className="text-slate-500 mb-8 max-w-[250px]">
                                    Jawaban ujian Anda telah tersimpan. Mengalihkan kembali ke dashboard...
                                </p>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-900"></div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
