import React from 'react';
import { 
  LayoutDashboard, 
  ClipboardList, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  Heart,
  ShieldAlert,
  Zap,
  HeartPulse,
  Wind,
  TrendingUp
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  isMinimized, 
  setIsMinimized, 
  currentUser, 
  onLogout 
}) {
  
  const renderMenuButton = (tab, label, Icon) => {
    const isActive = activeTab === tab;
    return (
      <button
        onClick={() => setActiveTab(tab)}
        className={`w-full flex items-center gap-3 px-4 py-2 rounded-[20px_8px_20px_8px] text-[10.5px] font-black tracking-wide transition-all duration-200 relative group overflow-hidden ${
          isActive
            ? 'bg-gradient-to-r from-teal-500/90 to-teal-650/95 text-white shadow-md shadow-teal-950/20'
            : 'text-teal-200/50 hover:text-white hover:bg-teal-900/15 hover:translate-x-1.5'
        } ${isMinimized ? 'justify-center px-0 hover:translate-x-0' : ''}`}
        title={label}
      >
        {/* Glow indicator line on active */}
        {isActive && !isMinimized && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-teal-355 rounded-r-full shadow-[0_0_8px_#5eead4]"></span>
        )}
        <Icon className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
          isActive ? 'text-white' : 'text-teal-355/40 group-hover:text-teal-250'
        }`} />
        {!isMinimized && <span>{label}</span>}
      </button>
    );
  };

  const renderCategoryHeader = (title) => {
    if (isMinimized) return <div className="border-t border-teal-900/20 my-2"></div>;
    return (
      <div className="text-[7.5px] font-black text-teal-400/35 uppercase tracking-widest px-4 pt-2.5 pb-1">
        {title}
      </div>
    );
  };

  return (
    <aside className={`transition-all duration-350 ease-in-out ${
      isMinimized ? 'w-20' : 'w-64'
    } bg-gradient-to-b from-teal-950 to-slate-950 text-slate-100 flex flex-col m-4 md:mr-0 md:my-5 md:ml-5 rounded-[40px_12px_40px_12px] shadow-[0_20px_50px_rgba(4,47,46,0.22)] border border-teal-900/40 md:h-[calc(100vh-2.5rem)] sticky top-5 z-50 shrink-0 overflow-hidden`}>
      
      {/* LOGO HEADER */}
      <div className={`p-4 border-b border-teal-900/60 flex items-center justify-between gap-3 ${
        isMinimized ? 'flex-col' : ''
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-teal-600 to-teal-400 rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-md shadow-teal-950/40 shrink-0">
            🐔
          </div>
          {!isMinimized && (
            <div>
              <h2 className="font-black text-sm text-white tracking-tight leading-none">
                Mercusuar
              </h2>
              <p className="text-[9px] text-teal-400 font-bold uppercase tracking-wider mt-1">Smart Farm</p>
            </div>
          )}
        </div>
        
        {/* Tombol Minimize */}
        <button 
          onClick={() => setIsMinimized(!isMinimized)} 
          className={`p-1.5 rounded-xl bg-teal-900/30 border border-teal-800/30 text-teal-300 hover:text-white hover:bg-teal-900/60 transition-all active:scale-95 ${
            isMinimized ? 'mt-2' : ''
          }`}
          title={isMinimized ? "Perbesar Sidebar" : "Perkecil Sidebar"}
        >
          {isMinimized ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* MENU NAVIGASI DENGAN GROUPING - TANPA SCROLL */}
      <nav className="flex-1 p-4 space-y-0.5 mt-2 overflow-hidden">
        
        {renderCategoryHeader('Dashboard Utama')}
        {renderMenuButton('monitoring', 'Monitoring Real-time', LayoutDashboard)}
        {renderMenuButton('populasi', 'Manajemen Populasi', ClipboardList)}
        {renderMenuButton('growth', 'FCR & Tumbuh Kembang', TrendingUp)}

        {renderCategoryHeader('Analisis Cerdik')}
        {renderMenuButton('health', 'Kesehatan & Aktivitas', HeartPulse)}
        {renderMenuButton('air', 'Kualitas Udara & Amonia', Wind)}
        {renderMenuButton('hsi', 'Kenyamanan HSI', Heart)}

        {renderCategoryHeader('Keamanan & Biaya')}
        {renderMenuButton('security', 'Keamanan Siaga Malam', ShieldAlert)}
        {renderMenuButton('energy', 'Efisiensi Energi Listrik', Zap)}

      </nav>

      {/* USER PROFILE & LOGOUT - KOMPAK */}
      <div className="p-3 border-t border-teal-900/50 bg-teal-950/15 space-y-2">
        <div className={`flex items-center gap-3 p-1.5 rounded-xl border border-teal-900/30 bg-teal-950/40 shadow-inner ${
          isMinimized ? 'justify-center' : ''
        }`}>
          <div className="relative shrink-0">
            <div className="w-8 h-8 bg-gradient-to-tr from-teal-700 to-teal-500 rounded-full flex items-center justify-center font-bold text-xs text-white border border-teal-600 shadow-inner">
              {currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : 'A'}
            </div>
            {/* Green Online Pulse Dot */}
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-teal-950 rounded-full animate-pulse"></span>
          </div>
          {!isMinimized && (
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-white truncate leading-none mb-0.5">{currentUser?.email || 'Memuat user...'}</p>
              <p className="text-[8px] text-teal-405 font-bold uppercase tracking-widest">{currentUser?.role || 'owner'}</p>
            </div>
          )}
        </div>
        
        <button
          onClick={onLogout}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl text-[10px] font-extrabold bg-teal-900/10 hover:bg-red-500/10 text-teal-350 hover:text-red-400 border border-teal-900/40 hover:border-red-500/20 transition-all active:scale-[0.98] ${
            isMinimized ? 'px-0' : ''
          }`}
          title="Log Out"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          {!isMinimized && <span>Keluar Sesi</span>}
        </button>
      </div>
    </aside>
  );
}
