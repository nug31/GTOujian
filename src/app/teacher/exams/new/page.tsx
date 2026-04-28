"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Image as ImageIcon, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/dataStore";
import { supabase } from "@/lib/supabase";

export default function NewExamPage() {
    const router = useRouter();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [duration, setDuration] = useState("120");
    const [targetClass, setTargetClass] = useState("Semua Kelas");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isRemedial, setIsRemedial] = useState(false);
    const [parentExamId, setParentExamId] = useState("");
    const [examType, setExamType] = useState<'practice' | 'theory'>('practice');
    const [isUnlimitedDuration, setIsUnlimitedDuration] = useState(false);
    const [questions, setQuestions] = useState<{ text: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { exams, addExam, fetchAvailableClasses, fetchExams } = useAppStore();

    useEffect(() => {
        if (exams.length === 0) fetchExams();
        const loadClasses = async () => {
            const { data } = await fetchAvailableClasses();
            if (data) setAvailableClasses(data);
        };
        loadClasses();
    }, [fetchAvailableClasses]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setUploadError(null);
        }
    };

    const removePreview = () => {
        setPreviewUrl(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadError(null);

        let finalImageUrl: string | undefined = undefined;

        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `blueprint_${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadErr } = await supabase.storage
                .from('blueprints')
                .upload(fileName, imageFile, { upsert: true });

            if (uploadErr || !uploadData) {
                console.error('Upload error:', uploadErr);
                setUploadError(`Gagal upload gambar: ${uploadErr?.message || 'Unknown error'}. Pastikan storage policy sudah diatur.`);
                setIsUploading(false);
                return; // Hentikan — jangan simpan dengan URL yang tidak valid
            }

            const { data: urlData } = supabase.storage
                .from('blueprints')
                .getPublicUrl(uploadData.path);
            finalImageUrl = urlData.publicUrl;
        }

        await addExam({
            title,
            description,
            duration: isUnlimitedDuration ? "Tanpa Batas Waktu" : `${duration} Menit`,
            status: 'Aktif',
            imageUrl: finalImageUrl,
            targetClass: targetClass,
            isRemedial: isRemedial,
            parentExamId: isRemedial ? parentExamId : undefined,
            examType,
            questions
        });

        setIsUploading(false);
        setSaved(true);
        setTimeout(() => {
            router.push("/teacher/exams");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-12 font-sans selection:bg-indigo-500/30">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors rounded-xl"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600">
                            <Save className="w-4 h-4" />
                        </div>
                        <h1 className="font-bold text-lg tracking-tight text-slate-900 font-outfit">Rakit Paket Soal Baru</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {!saved ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200 overflow-hidden">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-900 font-outfit">Detail Spesifikasi Ujian</h2>
                            <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">Lengkapi properti metadata ujian, batas waktu, dan konfigurasi soal (praktik Onshape atau teori esai).</p>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-8">
                            {/* Judul & Deskripsi */}
                            <div className="space-y-5">
                                <div className="group">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Judul Paket Ujian <span className="text-red-500">*</span></label>
                                    <input
                                        required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: Desain Velg Racing 17 Inch"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 text-sm font-medium shadow-sm"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Instruksi Eksekusi / Catatan <span className="text-red-500">*</span></label>
                                    <textarea
                                        required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Berikan instruksi teknis (misal: Set units ke mm, gunakan material Carbon Steel, pastikan Center of Mass sesuai)."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 text-sm font-medium resize-none shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-slate-700 group-focus-within:text-indigo-600 transition-colors">Durasi Pengerjaan (Menit) <span className="text-red-500">*</span></label>
                                    <label className="flex items-center gap-2 cursor-pointer group/check">
                                        <input 
                                            type="checkbox" 
                                            checked={isUnlimitedDuration} 
                                            onChange={(e) => setIsUnlimitedDuration(e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all"
                                        />
                                        <span className="text-xs font-bold text-slate-500 group-hover/check:text-indigo-600 transition-colors">Tanpa Batas Waktu</span>
                                    </label>
                                </div>
                                <input
                                    required={!isUnlimitedDuration} 
                                    type="number" 
                                    min="10" 
                                    value={duration} 
                                    onChange={(e) => setDuration(e.target.value)}
                                    disabled={isUnlimitedDuration}
                                    className={`w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 text-sm font-medium shadow-sm ${isUnlimitedDuration ? 'opacity-50 cursor-not-allowed bg-slate-100' : ''}`}
                                />
                            </div>

                            <div className="group">
                                <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Target Kelas <span className="text-red-500">*</span></label>
                                <select
                                    required
                                    value={targetClass}
                                    onChange={(e) => setTargetClass(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 text-sm font-medium shadow-sm appearance-none"
                                >
                                    <option value="Semua Kelas">Semua Kelas</option>
                                    {availableClasses.map((cls) => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="group">
                                    <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Tipe Paket <span className="text-red-500">*</span></label>
                                    <select
                                        required
                                        value={isRemedial ? "true" : "false"}
                                        onChange={(e) => setIsRemedial(e.target.value === "true")}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 text-sm font-medium shadow-sm appearance-none"
                                    >
                                        <option value="false">Ujian Utama (Reguler)</option>
                                        <option value="true">Ujian Remedial</option>
                                    </select>
                                </div>

                                {isRemedial && (
                                    <div className="group">
                                        <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">Pilih Ujian Utama <span className="text-red-500">*</span></label>
                                        <select
                                            required
                                            value={parentExamId}
                                            onChange={(e) => setParentExamId(e.target.value)}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:bg-white focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-900 text-sm font-medium shadow-sm appearance-none"
                                        >
                                            <option value="" disabled>Pilih Sumber Ujian</option>
                                            {exams.filter(e => !e.isRemedial).map((e) => (
                                                <option key={e.id} value={e.id}>{e.title}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Exam Type Selection */}
                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-3 group-focus-within:text-indigo-600 transition-colors">Tipe Ujian <span className="text-red-500">*</span></label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setExamType('practice')}
                                        className={`px-5 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${examType === 'practice' ? 'border-indigo-600 bg-indigo-50 ring-4 ring-indigo-500/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'}`}
                                    >
                                        <span className="font-bold text-sm font-outfit">Praktik (CAD)</span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Blueprint CAD</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setExamType('theory')}
                                        className={`px-5 py-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${examType === 'theory' ? 'border-emerald-600 bg-emerald-50 ring-4 ring-emerald-500/5' : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'}`}
                                    >
                                        <span className="font-bold text-sm font-outfit">Tulis / Logika</span>
                                        <span className="text-[10px] uppercase font-bold tracking-widest opacity-50">Soal Isian</span>
                                    </button>
                                </div>
                            </div>

                            {examType === 'theory' && (
                                <div className="pt-6 border-t border-slate-100 space-y-5">
                                    <div className="flex items-center justify-between">
                                        <label className="block text-sm font-bold text-slate-700">Daftar Pertanyaan Esai</label>
                                        <button
                                            type="button"
                                            onClick={() => setQuestions([...questions, { text: "" }])}
                                            className="text-[11px] font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 bg-white px-4 py-2 rounded-xl border-2 border-indigo-100 hover:border-indigo-600 transition-all uppercase tracking-wider flex items-center gap-1.5 shadow-sm"
                                        >
                                            + Tambah Baris Soal
                                        </button>
                                    </div>

                                    {questions.length === 0 && (
                                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                                            <p className="text-slate-400 text-xs font-medium">Belum ada pertanyaan yang dibuat.</p>
                                        </div>
                                    )}

                                    {questions.map((q, idx) => (
                                        <div key={idx} className="relative group bg-slate-50/30 border border-slate-200 rounded-2xl p-5 hover:border-indigo-200 hover:bg-white transition-all shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="mt-2 w-7 h-7 flex-shrink-0 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-xs font-bold text-slate-400 font-mono">
                                                    {idx + 1}
                                                </div>
                                                <textarea
                                                    required
                                                    value={q.text}
                                                    onChange={(e) => {
                                                        const newQ = [...questions];
                                                        newQ[idx].text = e.target.value;
                                                        setQuestions(newQ);
                                                    }}
                                                    placeholder="Tuliskan isi pertanyaan di sini..."
                                                    className="w-full bg-transparent border-none p-0 outline-none text-sm text-slate-800 font-medium resize-none min-h-[60px] focus:ring-0 leading-relaxed"
                                                    rows={Math.max(2, q.text.split('\n').length)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setQuestions(questions.filter((_, i) => i !== idx))}
                                                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-3">Gambar Blueprint Referensi <span className="text-slate-400 font-normal ml-1">(Sangat disarankan untuk ujian praktik)</span></label>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                {previewUrl ? (
                                    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center shadow-inner">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={previewUrl} alt="Preview" className="max-h-full object-contain" />
                                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                            <button
                                                type="button"
                                                onClick={removePreview}
                                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center text-sm font-bold"
                                            >
                                                <X className="w-4 h-4 mr-2" /> Hapus Gambar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-slate-300 bg-slate-50/50 hover:bg-indigo-50/30 hover:border-indigo-300 transition-all rounded-2xl p-10 flex flex-col items-center justify-center cursor-pointer group shadow-sm hover:shadow-md"
                                    >
                                        <div className="w-14 h-14 bg-white rounded-full shadow-[0_0_15px_rgba(0,0,0,0.05)] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <ImageIcon className="w-6 h-6 text-indigo-500" />
                                        </div>
                                        <p className="text-sm font-bold text-slate-800 mb-1">Klik untuk meramban berkas gambar</p>
                                        <p className="text-xs text-slate-500 font-medium">Unggah JPG atau PNG beresolusi tinggi (Maks 5MB)</p>
                                    </div>
                                )}

                                {uploadError && (
                                    <div className="mt-2 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs">{uploadError}</p>
                                    </div>
                                )}
                            </div>

                            <div className="bg-amber-50 rounded-xl p-5 flex items-start border border-amber-200/60 shadow-sm mt-8">
                                <AlertCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-amber-800 mb-1">Rekomendasi Komponen Visual</h4>
                                    <p className="text-sm text-amber-700/80 leading-relaxed font-medium">Resolusi gambar blueprint yang rendah (*pixelated*) berpotensi mendistorsi interpretasi siswa terhadap dimensi ukur yang dibutuhkan pada desain CAD. Dimohon untuk mengunggah gambar resolusi tinggi.</p>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end gap-3 mt-8">
                                <button type="button" onClick={() => router.back()} className="px-6 py-3 text-slate-600 font-bold bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-sm rounded-xl transition-all shadow-sm" disabled={isUploading}>
                                    Batalkan
                                </button>
                                <button type="submit" disabled={isUploading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-all flex items-center uppercase tracking-wide border border-indigo-500">
                                    {isUploading ? <><Loader2 className="w-4 h-4 mr-2.5 animate-spin" /> Merekam Payload...</> : <><Save className="w-4 h-4 mr-2.5" /> Publikasikan Soal</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-200">
                        <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-green-50/50">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-900 mb-3 font-outfit tracking-tight">Sukses Disimpan!</h2>
                        <p className="text-slate-500 mb-10 max-w-sm text-center leading-relaxed font-medium">
                            Paket konfigurasi soal baru ujian praktik telah diamankan dalam *database* bank soal GTO.
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-200 border-t-indigo-600"></div>
                    </motion.div>
                )}
            </main>
        </div >
    );
}
