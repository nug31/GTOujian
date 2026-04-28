"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, CheckCircle2, ChevronRight, LogOut, FileText, Search, Clock, AlertCircle, Edit, Trash2, RotateCw, CheckSquare, Square, X, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { useAppStore, Submission } from "@/lib/dataStore";

// Mock data submissions
export default function TeacherDashboard() {
    const router = useRouter();
    const [filter, setFilter] = useState<"all" | "pending" | "graded" | "missing">("all");
    const [classFilter, setClassFilter] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [availableClasses, setAvailableClasses] = useState<string[]>([]);
    const [teacherName, setTeacherName] = useState("Bpk. Ahmad Riyadi, S.T.");
    const { exams, submissions, students, fetchExams, fetchSubmissions, deleteSubmission, bulkUpdateSubmissions, isLoading } = useAppStore();
    const [examFilter, setExamFilter] = useState<string>("all");
    
    // Bulk selection state
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
    const [isBulkSaving, setIsBulkSaving] = useState(false);

    // Bulk grading criteria state
    const [bulkDimensi, setBulkDimensi] = useState(40);
    const [bulkFeatures, setBulkFeatures] = useState(40);
    const [bulkKerapian, setBulkKerapian] = useState(20);
    const [bulkFeedback, setBulkFeedback] = useState("Hasil pengerjaan sudah sesuai dengan blueprint referensi.");

    const totalBulkScore = Math.min(100, Math.max(0, bulkDimensi + bulkFeatures + bulkKerapian));


    useEffect(() => {
        const info = localStorage.getItem("user_info");
        if (info) {
            const parsed = JSON.parse(info);
            if (parsed.role === "teacher") setTeacherName(parsed.name);
        }
        fetchExams();
        fetchSubmissions();
        fetchClasses();

        // Subscribe to real-time changes
        const unsubscribe = useAppStore.getState().subscribeSubmissions();
        return () => unsubscribe();
    }, [fetchSubmissions]);

    const fetchClasses = async () => {
        const { data, error } = await useAppStore.getState().fetchAvailableClasses();
        if (!error && data) {
            setAvailableClasses(data);
        }
    };

    const handleLogout = () => {
        router.push("/login");
    };

    const handleRefresh = async () => {
        await fetchSubmissions();
        await fetchClasses();
    };

    const filteredSubmissions = submissions.filter((sub) => {
        const matchesFilter = filter === "all" || sub.status === filter;
        const matchesClass = classFilter === "all" || sub.studentClass === classFilter;
        const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.nis.includes(searchQuery);
        return (filter === "missing" ? false : matchesFilter) && matchesClass && matchesSearch;
    });

    const handleSelectAll = () => {
        if (selectedIds.length === filteredSubmissions.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredSubmissions.map(s => s.id));
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkGrade = async () => {
        setIsBulkSaving(true);
        try {
            await bulkUpdateSubmissions(selectedIds, {
                status: 'graded',
                score: totalBulkScore,
                criteria: {
                    dimension: bulkDimensi,
                    efficiency: bulkFeatures,
                    aesthetics: bulkKerapian
                },
                feedback: bulkFeedback
            });
            setIsBulkModalOpen(false);
            setSelectedIds([]);
            alert(`Berhasil menilai ${selectedIds.length} siswa sekaligus.`);
        } catch (error) {
            console.error("Bulk grade failed:", error);
            alert("Gagal melakukan penilaian masal.");
        } finally {
            setIsBulkSaving(false);
        }
    };

    // If filter is "missing", we need to combine roster with submissions
    const displayData = filter === "missing" ?
        students.filter(s => {
            const matchesClass = classFilter === "all" || s.class === classFilter;
            const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                s.nisn.includes(searchQuery);
            
            // If exam filter is specified, check if student submitted THAT exam
            // Otherwise, check if they submitted ANY exam
            const hasSubmitted = examFilter === "all" 
                ? submissions.some(sub => sub.nis === s.nisn)
                : submissions.some(sub => sub.nis === s.nisn && sub.examId === examFilter);

            // If exam filter is specified, only show students from the target class of that exam
            const currentExam = exams.find(e => e.id === examFilter);
            const matchesExamTargetClass = !currentExam || !currentExam.targetClass || currentExam.targetClass === "Semua Kelas" || s.class === currentExam.targetClass;

            return matchesClass && matchesSearch && !hasSubmitted && matchesExamTargetClass;
        }).map(s => ({
            id: `missing-${s.nisn}-${examFilter}`,
            studentName: s.name,
            nis: s.nisn,
            studentClass: s.class,
            examTitle: examFilter !== "all" ? (exams.find(e => e.id === examFilter)?.title || "-") : "-",
            submitTime: "-",
            status: "missing" as const,
            score: null,
            onshapeLink: "",
            isLate: false
        })) : filteredSubmissions.filter(sub => examFilter === "all" || sub.examId === examFilter);

    const formatDateTime = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return new Intl.DateTimeFormat('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch (e) {
            return dateStr;
        }
    };

    const exportToExcel = () => {
        // 1. Get students that match the current class filter
        const targetStudents = students.filter(s =>
            classFilter === "all" || s.class === classFilter
        );

        // 2. Map roster with submission data
        const mergedData = targetStudents.map(student => {
            // Find submission by NIS
            const submission = filteredSubmissions.find(sub => sub.nis === student.nisn);

            if (submission) {
                return {
                    "Kelas": submission.studentClass || student.class,
                    "Nama Siswa": submission.studentName,
                    "NIS": submission.nis,
                    "Judul Ujian": submission.examTitle,
                    "Waktu Kumpul": formatDateTime(submission.submitTime),
                    "Status": submission.status === "graded" ? "Sudah Dinilai" : "Menunggu Penilaian",
                    "Nilai": submission.score ?? "-",
                    "Link Onshape": submission.onshapeLink,
                    "Keterangan": submission.isLate ? "Terlambat" : "Tepat Waktu"
                };
            } else {
                return {
                    "Kelas": student.class,
                    "Nama Siswa": student.name,
                    "NIS": student.nisn,
                    "Judul Ujian": "-",
                    "Waktu Kumpul": "-",
                    "Status": "Belum Mengumpulkan",
                    "Nilai": "-",
                    "Link Onshape": "-",
                    "Keterangan": "-"
                };
            }
        });

        // 3. Sort by class and then by name
        const sortedData = mergedData.sort((a, b) => {
            if (a.Kelas < b.Kelas) return -1;
            if (a.Kelas > b.Kelas) return 1;
            return a["Nama Siswa"].localeCompare(b["Nama Siswa"]);
        });

        const worksheet = XLSX.utils.json_to_sheet(sortedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Penilaian");

        // Set column widths
        const wscols = [
            { wch: 12 }, // Kelas
            { wch: 25 }, // Nama Siswa
            { wch: 15 }, // NIS
            { wch: 30 }, // Judul Ujian
            { wch: 20 }, // Waktu Kumpul
            { wch: 20 }, // Status
            { wch: 10 }, // Nilai
            { wch: 40 }, // Link Onshape
            { wch: 15 }  // Keterangan
        ];
        worksheet["!cols"] = wscols;

        XLSX.writeFile(workbook, `Data_Penilaian_GTO_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    // Filter for statistics (ignores the all/pending/graded status filter)
    const statsFiltered = submissions.filter((sub) => {
        const matchesClass = classFilter === "all" || sub.studentClass === classFilter;
        const matchesExam = examFilter === "all" || sub.examId === examFilter;
        const matchesSearch = sub.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.nis.includes(searchQuery);
        return matchesClass && matchesExam && matchesSearch;
    });

    const pendingCount = statsFiltered.filter(s => s.status === 'pending').length;
    const gradedCount = statsFiltered.filter(s => s.status === 'graded').length;

    // Calculate "Belum Mengumpulkan"
    const submittedNis = new Set(statsFiltered.map(s => s.nis));
    const totalStudentsInClass = students.filter(s => {
        const matchesClass = classFilter === "all" || s.class === classFilter;
        const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.nisn.includes(searchQuery);
        
        const currentExam = exams.find(e => e.id === examFilter);
        const matchesExamTargetClass = !currentExam || !currentExam.targetClass || currentExam.targetClass === "Semua Kelas" || s.class === currentExam.targetClass;
        
        return matchesClass && matchesSearch && matchesExamTargetClass;
    });
    const notSubmittedCount = totalStudentsInClass.filter(s => !submittedNis.has(s.nisn)).length;

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
                            <span className="font-bold text-xl tracking-tighter text-slate-900 font-outfit text-primary-600">GTO</span>
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
                            onClick={handleRefresh}
                            className={`p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all ${isLoading ? 'animate-spin text-indigo-500' : ''}`}
                            title="Segarkan Data"
                            disabled={isLoading}
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
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
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Tabs Navigation */}
                <div className="mb-8 border-b border-slate-200">
                    <nav className="-mb-px flex space-x-8 overflow-x-auto hidden-scrollbar">
                        <Link href="/teacher" className="border-indigo-600 text-indigo-600 whitespace-nowrap pb-4 px-1 border-b-2 font-bold text-sm tracking-wide">Validasi & Penilaian</Link>
                        <Link href="/teacher/exams" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Bank Soal Ujian</Link>
                        <Link href="/teacher/students" className="border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300 whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors">Data Entitas Siswa</Link>
                    </nav>
                </div>

                <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight font-outfit">Validasi Pengumpulan Ujian</h1>
                        <p className="text-slate-500 mt-2 text-sm leading-relaxed max-w-xl">
                            Pantau, tinjau, dan berikan penilaian terhadap tugas-tugas *blueprint* 3D yang telah diserahkan oleh seluruh siswa.
                        </p>
                    </div>

                    {/* KPI Cards Mini */}
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setFilter("pending")}
                            className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all active:scale-95 text-left"
                        >
                            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl border border-amber-100/50">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Antrean Nilai</p>
                                <p className="text-2xl font-black text-slate-800 font-outfit">{pendingCount}</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter("graded")}
                            className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all active:scale-95 text-left"
                        >
                            <div className="p-3 bg-green-50 text-green-500 rounded-xl border border-green-100/50">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Selesai Dinilai</p>
                                <p className="text-2xl font-black text-slate-800 font-outfit">{gradedCount}</p>
                            </div>
                        </button>
                        <button
                            onClick={() => setFilter("missing")}
                            className="bg-white px-5 py-4 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center gap-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all active:scale-95 text-left"
                        >
                            <div className="p-3 bg-rose-50 text-rose-500 rounded-xl border border-rose-100/50">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-0.5">Belum Kumpul</p>
                                <p className="text-2xl font-black text-slate-800 font-outfit">{notSubmittedCount}</p>
                            </div>
                        </button>
                    </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex flex-col sm:flex-row gap-4 justify-between items-center relative z-10">
                    <div className="flex bg-slate-100 p-1.5 rounded-xl w-full sm:w-auto overflow-hidden">
                        <button
                            onClick={() => setFilter("all")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "all" ? "bg-white text-indigo-700 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Semua Tinjauan
                        </button>
                        <button
                            onClick={() => setFilter("pending")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "pending" ? "bg-white text-amber-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Menunggu Penilaian
                        </button>
                        <button
                            onClick={() => setFilter("graded")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "graded" ? "bg-white text-green-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Selesai Dinilai
                        </button>
                        <button
                            onClick={() => setFilter("missing")}
                            className={`flex-1 sm:px-6 py-2 text-sm font-bold rounded-lg transition-all ${filter === "missing" ? "bg-white text-rose-600 shadow-sm ring-1 ring-slate-200/50" : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Belum Mengumpulkan
                        </button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 pr-2 w-full sm:w-auto">
                        <select
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            className="w-full sm:w-32 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        >
                            <option value="all">Semua Kelas</option>
                            {availableClasses.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                        <select
                            value={examFilter}
                            onChange={(e) => setExamFilter(e.target.value)}
                            className="w-full sm:w-48 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all truncate"
                        >
                            <option value="all">Semua Paket Soal</option>
                            {exams.map(e => (
                                <option key={e.id} value={e.id}>{e.title}</option>
                            ))}
                        </select>
                        <div className="relative flex-1 sm:w-64 group hidden sm:block">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama atau NIS siswa..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 group-focus-within:bg-white rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 sm:text-sm text-slate-800 placeholder-slate-400 transition-all outline-none shadow-inner group-focus-within:shadow-none"
                            />
                        </div>
                        <button
                            onClick={exportToExcel}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95 whitespace-nowrap"
                        >
                            <FileText className="w-4 h-4" />
                            Ekspor Excel
                        </button>
                    </div>
                </div >

                {/* Submissions List */}
                < div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-x-auto" >
                    <table className="min-w-full divide-y divide-slate-200/80">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left">
                                    <button
                                        onClick={handleSelectAll}
                                        className="p-1 rounded hover:bg-slate-200 transition-colors"
                                        title="Pilih Semua"
                                    >
                                        {selectedIds.length === filteredSubmissions.length && filteredSubmissions.length > 0 ? (
                                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                                        ) : (
                                            <Square className="w-5 h-5 text-slate-400" />
                                        )}
                                    </button>
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Siswa
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Ujian
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Waktu Kumpul
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th scope="col" className="relative px-6 py-3">
                                    <span className="sr-only">Aksi</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                                        <p>Memuat data pengumpulan...</p>
                                    </td>
                                </tr>
                            ) : displayData.length > 0 ? (
                                displayData.map((sub, index) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        key={sub.id}
                                        className={`hover:bg-slate-50 transition-colors group ${selectedIds.includes(sub.id) ? 'bg-indigo-50/30' : ''}`}
                                    >
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <button
                                                onClick={() => toggleSelect(sub.id)}
                                                className="p-1 rounded hover:bg-indigo-100 transition-colors"
                                            >
                                                {selectedIds.includes(sub.id) ? (
                                                    <CheckSquare className="w-5 h-5 text-indigo-600" />
                                                ) : (
                                                    <Square className="w-5 h-5 text-slate-300" />
                                                )}
                                            </button>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shadow-sm">
                                                    {sub.studentName.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{sub.studentName}</div>
                                                    <div className="text-xs text-slate-500 mt-0.5 font-mono flex items-center gap-2">
                                                        {sub.nis}
                                                        {sub.studentClass && (
                                                            <span className="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border border-indigo-100">
                                                                {sub.studentClass}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            <div className="text-sm font-semibold text-slate-800 flex items-center bg-slate-50 w-fit px-3 py-1.5 rounded-lg border border-slate-200/60">
                                                <FileText className="w-4 h-4 mr-2 text-indigo-500" />
                                                {sub.examTitle}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap flex flex-col items-start justify-center">
                                            <span className="text-slate-600 font-mono text-xs font-medium">{formatDateTime(sub.submitTime)}</span>
                                            {sub.isLate && (
                                                <span className="mt-1.5 px-2 py-0.5 rounded-md bg-red-50 text-red-600 text-[10px] font-black tracking-widest uppercase border border-red-200 shadow-sm">
                                                    Terlambat Lewat Batas Waktu
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap">
                                            {sub.status === "graded" ? (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-green-50 text-green-700 border border-green-200/60 items-center justify-center gap-1.5 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Nilai Akhir: {sub.score}
                                                </span>
                                            ) : sub.status === "pending" ? (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 items-center justify-center gap-1.5 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div> Pending Appraisal
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200/60 items-center justify-center gap-1.5 shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> Belum Mengumpulkan
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                {sub.status === "graded" && (
                                                    <button
                                                        onClick={() => router.push(`/teacher/grade/${sub.id}`)}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all border border-transparent hover:border-indigo-100"
                                                        title="Revisi Nilai"
                                                    >
                                                        <Edit className="w-5 h-5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Hapus permanen berkas ujian dari ${sub.studentName}?`)) {
                                                            deleteSubmission(sub.id);
                                                        }
                                                    }}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all border border-transparent hover:border-red-100"
                                                    title="Hapus Pengumpulan"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() => router.push(`/teacher/grade/${sub.id}`)}
                                                    className={`inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-xl shadow-[0_0_15px_rgba(0,0,0,0.05)] text-white ${sub.status === "graded" ? "bg-slate-800 hover:bg-slate-700" :
                                                        sub.status === "missing" ? "bg-rose-600 hover:bg-rose-500" :
                                                            "bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                                                        } transition-all uppercase tracking-wide`}
                                                >
                                                    {sub.status === "graded" ? "Lihat Detail" : sub.status === "missing" ? "Tagih Tugas" : "Beri Nilai"}
                                                    <ChevronRight className="ml-1.5 w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="w-8 h-8 text-slate-300 mb-2" />
                                            <p>Tidak ada data siswa yang sesuai pencarian atau filter.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div >
            </main >

            {/* Selection Floating Bar */}
            {selectedIds.length > 0 && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
                >
                    <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/50 p-4 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-4 ml-2">
                            <div className="bg-indigo-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                                {selectedIds.length}
                            </div>
                            <div>
                                <p className="text-sm font-bold">Siswa Terpilih</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Aksi Masal Tersedia</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setSelectedIds([])}
                                className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={() => setIsBulkModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 active:scale-95"
                            >
                                <CheckSquare className="w-4 h-4" />
                                Nilai Masal ({selectedIds.length})
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Bulk Grade Modal */}
            {isBulkModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setIsBulkModalOpen(false)}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                    >
                        {/* Modal Header */}
                        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 font-outfit">Nilai Masal</h2>
                                <p className="text-slate-500 text-sm mt-0.5 font-medium">Beri nilai untuk {selectedIds.length} siswa sekaligus.</p>
                            </div>
                            <button
                                onClick={() => setIsBulkModalOpen(false)}
                                className="p-2 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                            {/* Rubric Item 1 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-slate-700">1. Kesesuaian Dimensi (Maks 40)</label>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-black">{bulkDimensi}</span>
                                </div>
                                <input
                                    type="range" min="0" max="40" value={bulkDimensi}
                                    onChange={(e) => setBulkDimensi(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] uppercase tracking-tighter font-bold text-slate-400 mt-2"><span>Minimal</span><span>Maksimal</span></div>
                            </div>

                            {/* Rubric Item 2 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-slate-700">2. Feature Tree & Efisiensi (Maks 40)</label>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-black">{bulkFeatures}</span>
                                </div>
                                <input
                                    type="range" min="0" max="40" value={bulkFeatures}
                                    onChange={(e) => setBulkFeatures(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] uppercase tracking-tighter font-bold text-slate-400 mt-2"><span>Minimal</span><span>Maksimal</span></div>
                            </div>

                            {/* Rubric Item 3 */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-bold text-slate-700">3. Kerapian & Estetika (Maks 20)</label>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg text-xs font-black">{bulkKerapian}</span>
                                </div>
                                <input
                                    type="range" min="0" max="20" value={bulkKerapian}
                                    onChange={(e) => setBulkKerapian(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                                <div className="flex justify-between text-[10px] uppercase tracking-tighter font-bold text-slate-400 mt-2"><span>Minimal</span><span>Maksimal</span></div>
                            </div>

                            <div className="pt-2">
                                <label className="block text-sm font-bold text-slate-700 mb-3">Feedback Umum (Tampil di semua siswa)</label>
                                <textarea
                                    rows={3}
                                    value={bulkFeedback}
                                    onChange={(e) => setBulkFeedback(e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none shadow-inner"
                                    placeholder="Contoh: Sangat bagus, pertahankan..."
                                />
                            </div>

                            {/* Total Display */}
                            <div className="bg-indigo-600 rounded-2xl p-6 text-white flex items-center justify-between shadow-xl shadow-indigo-600/20">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Akumulasi Skor Masal</p>
                                    <p className="text-sm font-medium">Nilai akan diberikan ke {selectedIds.length} siswa</p>
                                </div>
                                <div className="text-4xl font-black font-outfit leading-none">{totalBulkScore}</div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="bg-slate-50 px-8 py-6 border-t border-slate-100">
                            <button
                                onClick={handleBulkGrade}
                                disabled={isBulkSaving}
                                className="w-full bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-300 text-white font-bold py-4 rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
                            >
                                {isBulkSaving ? (
                                    <>
                                        <Loader2 className="w-6 h-6 animate-spin" /> Sedang Memproses...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-6 h-6" /> Terapkan & Simpan Nilai
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div >
    );
}
