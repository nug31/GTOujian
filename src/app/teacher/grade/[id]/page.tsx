"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, AlertCircle, Save, ExternalLink, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/dataStore";

export default function GradePage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();
    const { submissions, exams, updateSubmission, fetchSubmissions, fetchExams } = useAppStore();
    const submission = submissions.find(s => s.id === params.id);
    const exam = exams.find(e => e.id === submission?.examId);

    // State for rubric scores
    const [dimensi, setDimensi] = useState(0);
    const [features, setFeatures] = useState(0);
    const [kerapian, setKerapian] = useState(0);
    const [feedback, setFeedback] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (submissions.length === 0) fetchSubmissions();
        if (exams.length === 0) fetchExams();
    }, [submissions, exams, fetchSubmissions, fetchExams]);

    useEffect(() => {
        if (submission) {
            if (submission.criteria) {
                setDimensi(submission.criteria.dimension || 0);
                setFeatures(submission.criteria.efficiency || 0);
                setKerapian(submission.criteria.aesthetics || 0);
            }
            if (submission.feedback) {
                setFeedback(submission.feedback);
            }
        }
    }, [submission]);

    const totalScore = Math.min(100, Math.max(0, dimensi + features + kerapian));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            await updateSubmission(params.id, {
                status: 'graded',
                score: totalScore,
                criteria: {
                    dimension: dimensi,
                    efficiency: features,
                    aesthetics: kerapian
                },
                feedback: feedback
            });
            setSaved(true);
            setTimeout(() => {
                router.push("/teacher");
            }, 2000);
        } catch (error) {
            console.error("Failed to save grade:", error);
            alert("Gagal menyimpan nilai.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!submission) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Memuat data pengumpulan...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col h-screen max-h-screen overflow-hidden">
            {/* Top navbar */}
            <header className="bg-slate-900 border-b border-slate-800 text-white flex-shrink-0">
                <div className="px-4 sm:px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <span className="font-bold text-lg tracking-tight">Penilaian: {submission.studentName}</span>
                        <div className="flex flex-col ml-4 border-l border-slate-700 pl-4 py-1">
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Waktu Pengiriman</span>
                            <span className="text-xs text-slate-200 font-mono">
                                {new Date(submission.submitTime).toLocaleString('id-ID', {
                                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="text-sm text-slate-400 font-medium">{submission.examTitle}</span>
                    </div>
                </div>
            </header>

            {/* Main split view */}
            <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                {/* Left pane: Onshape Viewer */}
                <div className="flex-1 bg-slate-200 flex flex-col border-r border-slate-300 relative">
                    <div className="absolute top-4 left-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-sm flex justify-between items-center">
                        <div className="flex items-center text-sm">
                            <span className="font-semibold text-slate-700 mr-2">Link Siswa:</span>
                            <span className="text-blue-600 truncate max-w-xs sm:max-w-sm font-mono">{submission.onshapeLink}</span>
                        </div>
                        <a
                            href={submission.onshapeLink}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors border border-slate-300"
                        >
                            Buka di Tab Baru <ExternalLink className="w-3 h-3 ml-1.5" />
                        </a>
                    </div>

                    {/* Iframe Placeholder simulating Onshape */}
                    <div className="w-full h-full bg-slate-300 flex flex-col items-center justify-center relative shadow-inner overflow-hidden">
                        {/* grid background */}
                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

                        <div className="z-10 text-center w-full px-10">
                            {exam?.imageUrl ? (
                                <div className="max-w-2xl mx-auto bg-white p-2 rounded-xl shadow-lg border-4 border-slate-400/50 group relative">
                                    <img
                                        src={exam.imageUrl}
                                        alt="Blueprint Soal"
                                        className="w-full h-auto rounded-lg"
                                    />
                                    <div className="absolute bottom-4 right-4 bg-slate-900/80 text-white text-[10px] px-2 py-1 rounded font-mono">BLUEPRINT REFERENSI</div>
                                </div>
                            ) : (
                                <>
                                    <div className="w-48 h-48 border-8 border-indigo-400/50 rounded-full mx-auto relative animate-pulse shadow-2xl">
                                        <div className="absolute inset-0 m-auto w-10 h-10 border-4 border-indigo-400/50 rounded-full" />
                                        <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-indigo-400/30 -translate-x-1/2 transform rotate-0" />
                                        <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-indigo-400/30 -translate-x-1/2 transform rotate-72" />
                                        <div className="absolute top-0 bottom-0 left-1/2 w-3 bg-indigo-400/30 -translate-x-1/2 transform -rotate-72" />
                                    </div>
                                    <p className="mt-6 text-slate-600 font-medium bg-white/50 px-4 py-2 rounded-full inline-block backdrop-blur-sm border border-white/60">
                                        No Blueprint Image Available
                                    </p>
                                </>
                            )}
                            <p className="mt-4 text-slate-500 text-xs font-medium italic">Gunakan blueprint di atas untuk memvalidasi hasil Onshape siswa.</p>
                        </div>
                    </div>
                </div>

                {/* Right pane: Grading Rubric */}
                <div className="w-full lg:w-[450px] bg-white flex flex-col overflow-y-auto z-20 shadow-[-10px_0_20px_rgba(0,0,0,0.05)]">
                    <div className="p-6">
                        {!saved ? (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex flex-col h-full">
                                <div className="mb-6 pb-6 border-b border-slate-100">
                                    <h2 className="text-xl font-bold text-slate-900">Rubrik Penilaian</h2>
                                    <p className="text-slate-500 text-sm mt-1">Beri nilai berdasarkan kriteria berikut.</p>
                                </div>

                                <form onSubmit={handleSave} className="space-y-6">
                                    {/* Rubric Item 1 */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-semibold text-slate-800">1. Kesesuaian Dimensi (Maks 40)</label>
                                            <span className="text-sm font-bold text-indigo-600">{dimensi}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">Ketepatan ukuran, toleransi, dan spesifikasi Mass Properties.</p>
                                        <input
                                            type="range" min="0" max="40" value={dimensi}
                                            onChange={(e) => setDimensi(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>40</span></div>
                                    </div>

                                    {/* Rubric Item 2 */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-semibold text-slate-800">2. Feature Tree & Efisiensi (Maks 40)</label>
                                            <span className="text-sm font-bold text-indigo-600">{features}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">Langkah pengerjaan logis, tidak banyak error/redundant extrude di Onshape.</p>
                                        <input
                                            type="range" min="0" max="40" value={features}
                                            onChange={(e) => setFeatures(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>40</span></div>
                                    </div>

                                    {/* Rubric Item 3 */}
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-semibold text-slate-800">3. Kerapian & Estetika (Maks 20)</label>
                                            <span className="text-sm font-bold text-indigo-600">{kerapian}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 mb-3">Penamaan part, pemberian material, fillet, dan detail visual.</p>
                                        <input
                                            type="range" min="0" max="20" value={kerapian}
                                            onChange={(e) => setKerapian(parseInt(e.target.value))}
                                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                        />
                                        <div className="flex justify-between text-xs text-slate-400 mt-1"><span>0</span><span>20</span></div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <label className="block text-sm font-semibold text-slate-800 mb-2">Catatan/Feedback (Opsional)</label>
                                        <textarea
                                            rows={3}
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Masukkan catatan perbaikan untuk siswa..."
                                            className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        />
                                    </div>

                                    {/* Total Score Display */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-center justify-between">
                                        <div>
                                            <span className="block text-sm font-medium text-slate-500">Total Nilai</span>
                                            <span className="text-xs text-slate-400">Skala 0-100</span>
                                        </div>
                                        <span className={`text-3xl font-black ${totalScore >= 75 ? 'text-green-600' : 'text-amber-500'}`}>
                                            {totalScore}
                                        </span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium py-3 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" /> Menyimpan...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" /> Simpan Nilai
                                            </>
                                        )}
                                    </button>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center h-full text-center py-12"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">Nilai Tersimpan!</h2>
                                <p className="text-slate-500 mb-8 max-w-[250px]">
                                    Nilai akhir {totalScore} telah dikirim ke daftar nilai Budi Santoso.
                                </p>
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-300 border-t-indigo-600"></div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
