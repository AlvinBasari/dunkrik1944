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

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* LOGO & BRAND */}
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-teal-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-lg shadow-teal-600/10 mb-4 border border-teal-500/20">
            🐔
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-800">
            Mercusuar Smart Chicken Farm
          </h2>
          <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
            Control Center & Analytics Platform
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-100 relative">
          
          <h3 className="text-base font-extrabold text-slate-800 mb-6">Masuk ke Dashboard</h3>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Input Email */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="admin@mercusuar.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs uppercase font-bold tracking-wider text-slate-400 mb-2">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-300"
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
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-teal-600/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2 flex items-center justify-center gap-2"
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
        <div className="bg-teal-50/50 p-4 rounded-2xl border border-teal-100/60 text-center">
          <p className="text-[11px] text-teal-700 font-medium">
            🔑 Kredensial Administrator Default:
          </p>
          <p className="text-xs font-bold text-slate-700 mt-1">
            Email: <code className="bg-teal-100/50 px-1 py-0.5 rounded text-teal-800">admin@mercusuar.com</code> 
            <span className="mx-2">|</span>
            Pass: <code className="bg-teal-100/50 px-1 py-0.5 rounded text-teal-800">password123</code>
          </p>
        </div>

      </div>
    </div>
  );
}
