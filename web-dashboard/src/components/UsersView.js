import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Mail, Lock, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function UsersView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('owner');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all users
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error("Gagal memuat daftar user");
      const data = await res.json();
      if (data.status === 'ok') {
        setUsers(data.users);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle create user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role })
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || "Gagal membuat user baru");
      }

      setSuccess(`User ${email} berhasil didaftarkan!`);
      setEmail('');
      setPassword('');
      setRole('owner');
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete user
  const handleDelete = async (id, userEmail) => {
    if (userEmail === currentUser?.email) {
      alert("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif!");
      return;
    }
    
    if (!window.confirm(`Apakah Anda yakin ingin menghapus user ${userEmail}?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingId(id);

    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: 'DELETE'
      });

      const data = await res.json();
      if (!res.ok || data.status === 'error') {
        throw new Error(data.message || "Gagal menghapus user");
      }

      setSuccess(`User ${userEmail} berhasil dihapus.`);
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      
      {/* KIRI: FORM TAMBAH USER (1/3 width) */}
      <div className="lg:col-span-1 space-y-6">
        <div className="glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl shadow-sm">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-800 tracking-tight">Tambah User Baru</h4>
              <p className="text-[10px] text-slate-400 font-medium">Beri akses masuk tambahan ke dashboard</p>
            </div>
          </div>

          {error && (
            <div className="p-3.5 mb-5 rounded-xl bg-red-50 border border-red-200/50 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="break-all">{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3.5 mb-5 rounded-xl bg-teal-50 border border-teal-200/50 text-teal-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-1.5">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="user@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-350"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all placeholder:text-slate-350"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-1.5">
                Peran Akses (Role)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Shield className="w-4 h-4" />
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/20 transition-all cursor-pointer"
                >
                  <option value="owner">Owner (Hak Akses Penuh)</option>
                  <option value="worker">Worker (Operator Kandang)</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-teal-600/10 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
            >
              {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan User'}
            </button>
          </form>
        </div>
      </div>

      {/* KANAN: LIST USER (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
          <h3 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
            <Users className="w-5 h-5 text-teal-600" /> Daftar Pengguna Terdaftar
          </h3>

          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
              <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Memuat daftar user...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs font-medium">
              Tidak ada user yang ditemukan.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    <th className="pb-3 pl-2">Email Pengguna</th>
                    <th className="pb-3">Peran Akses</th>
                    <th className="pb-3 text-right pr-2">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 pl-2 font-bold text-xs text-slate-705">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-slate-100 text-slate-700 font-extrabold text-[11px] rounded-full flex items-center justify-center uppercase shrink-0 border border-slate-150/40">
                            {user.email.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate max-w-[150px] sm:max-w-xs">{user.email}</p>
                            {user.email === currentUser?.email && (
                              <span className="text-[8px] bg-teal-50 text-teal-700 px-1.5 py-0.5 rounded-md font-extrabold mt-0.5 inline-block">Sesi Aktif</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
                          user.role === 'owner' 
                            ? 'bg-teal-50 text-teal-700 border-teal-100/50' 
                            : 'bg-slate-50 text-slate-600 border-slate-200/50'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          disabled={user.email === currentUser?.email || deletingId === user.id}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                          title="Hapus Pengguna"
                        >
                          {deletingId === user.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-red-500/20 border-t-red-500 rounded-full animate-spin inline-block"></span>
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
