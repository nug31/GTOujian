"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Wrench, User, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
    const router = useRouter();
    const [role, setRole] = useState<"student" | "teacher">("student");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (role === "student") {
                // Validation against students table using NISN
                const { data, error: sbError } = await supabase
                    .from('students')
                    .select('*')
                    .eq('nisn', username)
                    .single();

                if (sbError || !data) {
                    throw new Error("NISN tidak terdaftar. Hubungi guru Anda.");
                }

                // If password is required, check it here. For now, we use NISN as password too for simplicity
                if (password !== username && password !== "12345") {
                    throw new Error("Password salah. Gunakan NISN atau password standar.");
                }

                // Store student info for the session
                localStorage.setItem("user_info", JSON.stringify({
                    name: data.name,
                    nisn: data.nisn,
                    class: data.class,
                    role: "student"
                }));

                router.push("/student");
            } else {
                // Real Teacher Login from Database
                const { data, error: sbError } = await supabase
                    .from('teachers')
                    .select('*')
                    .eq('username', username)
                    .eq('password', password)
                    .single();

                if (sbError || !data) {
                    throw new Error("Username atau Password guru salah.");
                }

                localStorage.setItem("user_info", JSON.stringify({
                    name: data.name,
                    role: "teacher"
                }));
                router.push("/teacher");
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-500/10 rounded-full blur-3xl" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-2xl shadow-xl z-10 overflow-hidden border border-slate-100"
            >
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
                    <Wrench className="w-12 h-12 mx-auto mb-4 opacity-90" />
                    <h1 className="text-2xl font-bold tracking-tight">Ujian GTO</h1>
                    <p className="text-blue-100 text-sm mt-2">Gambar Teknik Otomotif</p>
                </div>

                <div className="p-8">
                    <div className="flex bg-slate-100 p-1 rounded-lg mb-8">
                        <button
                            onClick={() => setRole("student")}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "student"
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Siswa
                        </button>
                        <button
                            onClick={() => setRole("teacher")}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === "teacher"
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                                }`}
                        >
                            Guru
                        </button>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center text-red-700 gap-2 text-sm"
                            >
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                {role === "student" ? "NISN Siswa" : "NIP / Username"}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-slate-800"
                                    placeholder={role === "student" ? "Masukkan NISN" : "Masukkan username"}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Password
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors text-slate-800"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                            disabled={isLoading}
                            type="submit"
                            className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white transition-colors ${role === "student"
                                ? "bg-blue-600 hover:bg-blue-700"
                                : "bg-indigo-600 hover:bg-indigo-700"
                                } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>Masuk <ArrowRight className="ml-2 w-4 h-4" /></>
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>

            <p className="mt-8 text-sm text-slate-500 flex items-center gap-1 z-10">
                Didukung oleh <span className="font-semibold text-slate-700">Onshape</span>
            </p>
        </div>
    );
}
