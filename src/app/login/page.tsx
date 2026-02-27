"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Triangle, User, Lock, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
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
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-500/30">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40rem] h-[40rem] bg-indigo-500/10 rounded-full blur-3xl opacity-70" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[35rem] h-[35rem] bg-blue-500/10 rounded-full blur-3xl opacity-70" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] z-10 overflow-hidden border border-slate-200"
            >
                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-10 text-white text-center relative overflow-hidden">
                    {/* Inner abstract decoration */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>

                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-5 shadow-inner ring-1 ring-white/30">
                            <Triangle className="w-8 h-8 text-white fill-white/20" />
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tighter font-outfit">GTO</h1>
                        <p className="text-indigo-100 font-medium text-xs mt-2 tracking-widest uppercase">Gambar Teknik Otomotif</p>
                    </div>
                </div>

                <div className="p-8 pb-10">
                    <div className="flex bg-slate-100/80 p-1.5 rounded-xl mb-8 border border-slate-200/50 shadow-inner">
                        <button
                            onClick={() => setRole("student")}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "student"
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Siswa
                        </button>
                        <button
                            onClick={() => setRole("teacher")}
                            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === "teacher"
                                ? "bg-white text-indigo-600 shadow-sm ring-1 ring-black/5"
                                : "text-slate-500 hover:text-slate-800"
                                }`}
                        >
                            Guru
                        </button>
                    </div>

                    <AnimatePresence>
                        {!!error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mb-6 overflow-hidden"
                            >
                                <div className="p-4 bg-red-50 border border-red-200/60 rounded-xl flex items-start text-red-700 gap-3 shadow-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium leading-relaxed">{error}</span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                                {role === "student" ? "NISN Siswa" : "NIP / Username"}
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 sm:text-sm font-medium transition-all text-slate-900 shadow-sm"
                                    placeholder={role === "student" ? "Masukkan NISN Anda" : "Masukkan username Guru"}
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-2 group-focus-within:text-indigo-600 transition-colors">
                                Kata Sandi
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 sm:text-sm font-medium transition-all text-slate-900 shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={isLoading}
                            type="submit"
                            className={`w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_20px_rgba(79,70,229,0.4)] text-sm font-bold text-white transition-all mt-4 border border-indigo-500 ${role === "student"
                                ? "bg-blue-600 hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.3)] border-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
                                : "bg-indigo-600 hover:bg-indigo-500"
                                } ${isLoading ? "opacity-70 cursor-not-allowed scale-100" : ""}`}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                                    <span className="uppercase tracking-wide">Mengautentikasi...</span>
                                </>
                            ) : (
                                <><span className="uppercase tracking-wide">Masuk Sistem</span> <ArrowRight className="ml-3 w-5 h-5" /></>
                            )}
                        </motion.button>
                    </form>
                </div>
            </motion.div>

        </div>
    );
}
