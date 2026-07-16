import React from 'react';
import { RefreshCw, Menu } from 'lucide-react';

export default function Header({ 
  activeTab, 
  isConnected, 
  isFetching, 
  onRefresh,
  onToggleMobileMenu
}) {
  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'populasi':
        return 'Manajemen Populasi & Siklus';
      case 'growth':
        return 'Analisis FCR & Tumbuh Kembang';
      case 'health':
        return 'Analisis Keaktifan & Kesehatan Ayam';
      case 'air':
        return 'Kualitas Udara & Toksisitas Amonia';
      case 'hsi':
        return 'Analisis Kenyamanan Ayam (HSI)';
      case 'security':
        return 'Keamanan Kandang (Night Watch)';
      case 'energy':
        return 'Analisis Konsumsi Energi & Listrik';
      case 'users':
        return 'Manajemen Pengguna & Otoritas';
      case 'monitoring':
      default:
        return 'Monitoring Kandang Real-time';
    }
  };

  const getHeaderDesc = () => {
    switch (activeTab) {
      case 'users':
        return 'Kelola pendaftaran akun admin/operator kandang tambahan';
      case 'populasi':
        return 'Atur data ayam masuk dan siklus panen';
      case 'growth':
        return 'Proyeksi bobot ayam dan estimasi pakan terbuang akibat stres lingkungan';
      case 'health':
        return 'Deteksi vitalitas siang hari dan tingkat kegelisahan malam hari';
      case 'air':
        return 'Pantau akumulasi paparan gas amonia dan manajemen alas kandang';
      case 'hsi':
        return 'Pantau tingkat stres termal dan kelembaban ayam';
      case 'security':
        return 'Log sensor gerak dan siaga predator malam hari';
      case 'energy':
        return 'Kalkulator efisiensi daya listrik exhaust blower';
      case 'monitoring':
      default:
        return 'Sensor IoT & Kontrol Aktuator';
    }
  };

  return (
    <header className="bg-white/80 backdrop-blur-md py-3 px-4 md:py-4 md:px-8 flex justify-between items-center rounded-[20px_8px_20px_8px] border border-slate-150/40 shadow-[0_8px_30px_rgba(0,0,0,0.015)] my-3 mx-3 md:my-5 md:mr-5 md:ml-4 sticky top-3 md:top-5 z-40">
      {/* KIRI: JUDUL & SUBJUDUL */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 transition-all active:scale-95 shrink-0"
          title="Menu Utama"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-sm font-black text-slate-800 tracking-tight leading-none">
            {getHeaderTitle()}
          </h1>
          <p className="text-[8.5px] text-slate-400 mt-1 uppercase font-bold tracking-widest">
            {getHeaderDesc()}
          </p>
        </div>
      </div>

      {/* KANAN: AKADEMIK & STATUS & REFRESH */}
      <div className="flex items-center gap-4">
        
        {/* ACADEMIC METADATA BADGE (UAS INFO) */}
        <div className="hidden sm:flex flex-col items-end text-[9px] md:text-[10.5px] font-black tracking-wider uppercase bg-gradient-to-r from-teal-50 to-teal-100/60 border border-teal-200/60 rounded-2xl px-3.5 py-1.5 text-right shadow-[0_4px_12px_rgba(13,148,136,0.04)]">
          <p className="text-teal-900">STMIK MERCUSUAR • TUGAS UAS</p>
          <p className="mt-0.5 text-teal-600 font-extrabold">MIKROPROSESOR • DOSEN: BP. IKRAR</p>
        </div>

        {/* Pulsing Dot Connection Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-100 shadow-[0_4px_12px_rgb(0,0,0,0.01)] text-[9px] font-extrabold text-slate-600">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-teal-500 animate-pulse' : 'bg-red-500'} shrink-0`} />
          <span>{isConnected ? 'ONLINE' : 'DISCONNECTED'}</span>
        </div>

        {/* Flat Refresh Button */}
        <button 
          onClick={onRefresh} 
          className="p-2 hover:bg-slate-200/50 rounded-xl text-slate-400 hover:text-slate-600 transition-all active:scale-95 shrink-0"
          title="Refresh Data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
}
