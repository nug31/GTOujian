"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Image as ImageIcon, CheckCircle2, AlertCircle, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/dataStore";
import { supabase } from "@/lib/supabase";

export default function EditExamPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
    const params = use(paramsPromise);
    const router = useRouter();

    // Initial values populated from mock id
    const [title, setTitle] = useState("Desain Velg Racing 17 Inch");
    const [description, setDescription] = useState("Buatlah model 3D velg racing jari-jari 5 sesuai dengan dimensi dari blueprint yang tersedia.");
    const [duration, setDuration] = useState("120");
    const [dueDate, setDueDate] = useState("2026-02-28T14:00");
    const [imageUrl, setImageUrl] = useState("");
    const [storedImageUrl, setStoredImageUrl] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { exams, updateExam, fetchExams } = useAppStore();

    // Fetch list if empty
    useEffect(() => {
        if (exams.length === 0) {
            fetchExams();
        }
    }, [exams, fetchExams]);

    // Fetch initial data
    useEffect(() => {
        const exam = exams.find(e => e.id === params.id);
        if (exam) {
            setTitle(exam.title);
            setDescription(exam.description);
            setDuration(exam.duration.split(' ')[0]);
            // Format dueDate back to datetime-local format
            const dateParts = exam.dueDate.split(', ');
            if (dateParts.length === 2) {
                setDueDate(dateParts[0] + 'T' + dateParts[1]);
            }
            if (exam.imageUrl) {
                setImageUrl(exam.imageUrl);
                // Hanya tampilkan jika URL valid dari Supabase Storage
                if (exam.imageUrl.startsWith('https://')) {
                    setStoredImageUrl(exam.imageUrl);
                }
            }
        }
    }, [params.id, exams]);

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
        setStoredImageUrl(null);
        setImageUrl("");
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadError(null);

        // Jika ada file baru dipilih → upload; jika tidak → pakai URL yang sudah tersimpan di DB
        let finalImageUrl: string | undefined = storedImageUrl || undefined;

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

        await updateExam(params.id, {
            title,
            description,
            duration: `${duration} Menit`,
            dueDate: dueDate.replace('T', ', '),
            imageUrl: finalImageUrl
        });

        setIsUploading(false);
        setSaved(true);
        setTimeout(() => {
            router.push("/teacher/exams");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-slate-50 relative pb-12">
            {/* Header */}
            <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-20 shadow-sm">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors rounded-full hover:bg-slate-800"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="font-bold text-lg tracking-tight">Edit Soal: {params.id}</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {!saved ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <h2 className="text-xl font-bold text-slate-800">Perbarui Detail Soal Praktik Onshape</h2>
                            <p className="text-sm text-slate-500 mt-1">Ubah informasi blueprint dan instruksi untuk siswa.</p>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            {/* Judul & Deskripsi */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Judul Ujian <span className="text-red-500">*</span></label>
                                    <input
                                        required type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Contoh: Desain Velg Racing 17 Inch"
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-800 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Instruksi / Deskripsi Singkat <span className="text-red-500">*</span></label>
                                    <textarea
                                        required rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Berikan instruksi jelas (misal: set units ke mm, gunakan material Steel, dsb)."
                                        className="w-full border border-slate-300 rounded-lg px-4 py-3 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-800 text-sm resize-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Durasi Pengerjaan (Menit) <span className="text-red-500">*</span></label>
                                    <input
                                        required type="number" min="10" value={duration} onChange={(e) => setDuration(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-800 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Batas Pengumpulan <span className="text-red-500">*</span></label>
                                    <input
                                        required type="datetime-local" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full border border-slate-300 rounded-lg px-4 py-2.5 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all text-slate-800 text-sm"
                                    />
                                </div>
                            </div>

                            {/* Upload Gambar Blueprint */}
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gambar Blueprint Soal <span className="text-slate-400 font-normal">(Opsional untuk MVP)</span></label>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />

                                {(() => {
                                    const displayUrl = previewUrl || storedImageUrl;
                                    return displayUrl ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={displayUrl} alt="Preview" className="max-h-full object-contain" />
                                            <button
                                                type="button"
                                                onClick={removePreview}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-indigo-300 bg-indigo-50 hover:bg-slate-100 transition-colors rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer group"
                                        >
                                            <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                <ImageIcon className="w-6 h-6 text-indigo-500" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-700">Ganti file gambar blueprint</p>
                                            <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                                        </div>
                                    );
                                })()}

                                {uploadError && (
                                    <div className="mt-2 flex items-start gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                        <p className="text-xs">{uploadError}</p>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => router.back()} disabled={isUploading} className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium text-sm rounded-lg transition-colors">
                                    Batal
                                </button>
                                <button type="submit" disabled={isUploading} className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center">
                                    {isUploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</> : <><Save className="w-4 h-4 mr-2" /> Perbarui Soal</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl shadow-sm border border-slate-200">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Soal Berhasil Diperbarui!</h2>
                        <p className="text-slate-500 mb-8 max-w-[300px] text-center">
                            Perubahan pada bank soal telah berhasil disimpan.
                        </p>
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-300 border-t-indigo-600"></div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
