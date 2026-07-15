'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || 'Login gagal. Periksa kembali email & password.');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      
      {/* Background Ornamen Cahaya Tosca Lembut */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-teal-500/5 blur-3xl -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-cyan-500/5 blur-3xl -z-10"></div>

      <div className="w-full max-w-md z-10 space-y-5">
        
        {/* LOGO & BRAND */}
        <div className="text-center">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-teal-600 rounded-2xl flex items-center justify-center font-bold text-2xl sm:text-3xl shadow-lg shadow-teal-600/10 mb-3 sm:mb-4 border border-teal-500/20">
            🐔
          </div>
          <h2 className="text-lg sm:text-2xl font-black tracking-tight text-slate-800 px-2 leading-tight">
            Mercusuar Smart Chicken Farm
          </h2>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
            Control Center & Analytics Platform
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white p-5 sm:p-8 rounded-[24px_10px_24px_10px] sm:rounded-3xl border border-slate-200/85 shadow-xl shadow-slate-100/50 relative">
          
          <h3 className="text-sm sm:text-base font-extrabold text-slate-800 mb-5">Masuk ke Dashboard</h3>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email */}
            <div>
              <label className="block text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@mercusuar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 sm:py-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-[10px] sm:text-xs uppercase font-bold tracking-wider text-slate-400 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 sm:py-3 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 sm:py-3.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-teal-600/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  <span>Masuk Aman</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* DEFAULT CREDENTIALS INFO */}
        <div className="bg-teal-50/50 p-3.5 rounded-2xl border border-teal-100/60 text-center">
          <p className="text-[10px] sm:text-[11px] text-teal-700 font-bold">
            🔑 Kredensial Administrator Default:
          </p>
          <p className="text-[10px] sm:text-xs font-bold text-slate-700 mt-1 flex flex-wrap justify-center gap-1 sm:gap-2">
            <span>Email: <code className="bg-teal-100/50 px-1 py-0.5 rounded text-teal-800 font-mono">admin@mercusuar.com</code></span> 
            <span className="hidden sm:inline opacity-30">|</span>
            <span>Pass: <code className="bg-teal-100/50 px-1 py-0.5 rounded text-teal-800 font-mono">password123</code></span>
          </p>
        </div>

        {/* ACADEMIC METADATA SIGNATURE */}
        <div className="text-center pt-2 space-y-1">
          <p className="text-[8.5px] text-slate-400 font-black uppercase tracking-widest">
            STMIK MERCUSUAR • TUGAS UAS MIKROPROSESOR
          </p>
          <p className="text-[8px] text-teal-600 font-black uppercase tracking-wider">
            DOSEN PENGAMPU: BP. IKRAR
          </p>
        </div>

      </div>
    </div>
  );
}
