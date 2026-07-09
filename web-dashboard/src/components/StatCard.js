import React from 'react';

export default function StatCard({ title, value, icon: Icon, status = 'safe', subtext, glow = false }) {
  let statusColorClasses = '';
  let badgeColor = '';
  let badgeText = '';
  let iconBgColor = '';
  let textGradient = '';
  let dotPingColor = '';
  let shadowColor = '';

  if (status === 'safe') {
    statusColorClasses = 'border-teal-500/10 hover:border-teal-400/40 bg-gradient-to-br from-white to-teal-50/15';
    badgeText = 'Aman';
    badgeColor = 'bg-teal-50/60 text-teal-700 border-teal-200/20';
    iconBgColor = 'from-teal-500 to-teal-600 text-white shadow-md shadow-teal-500/20';
    textGradient = 'from-slate-800 to-teal-700';
    dotPingColor = 'bg-teal-500';
    shadowColor = 'hover:shadow-teal-900/[0.04]';
  } else if (status === 'warning') {
    statusColorClasses = 'border-amber-500/10 hover:border-amber-400/40 bg-gradient-to-br from-white to-amber-50/15';
    badgeText = 'Waspada';
    badgeColor = 'bg-amber-50/60 text-amber-700 border-amber-200/20';
    iconBgColor = 'from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20';
    textGradient = 'from-slate-800 to-amber-700';
    dotPingColor = 'bg-amber-500';
    shadowColor = 'hover:shadow-amber-900/[0.04]';
  } else {
    statusColorClasses = 'border-red-500/10 hover:border-red-400/40 bg-gradient-to-br from-white to-red-50/15';
    badgeText = 'Bahaya';
    badgeColor = 'bg-red-50/60 text-red-700 border-red-200/20';
    iconBgColor = 'from-red-500 to-red-650 text-white shadow-md shadow-red-500/20';
    textGradient = 'from-slate-800 to-red-700';
    dotPingColor = 'bg-red-500';
    shadowColor = 'hover:shadow-red-900/[0.04]';
  }

  return (
    <div className={`glass-card rounded-[32px_12px_32px_12px] relative overflow-hidden transition-all duration-500 border p-6 flex flex-col justify-between shadow-[0_12px_24px_rgba(4,47,46,0.018)] hover:-translate-y-1.5 hover:shadow-xl ${shadowColor} ${statusColorClasses}`}>
      
      {/* Ornamen Latar Belakang Lingkaran Halus (Efek Kedalaman 3D) */}
      <div className={`absolute -right-4 -top-4 w-28 h-28 rounded-full blur-2xl opacity-10 bg-gradient-to-br ${
        status === 'safe' ? 'from-teal-400 to-cyan-400' : status === 'warning' ? 'from-amber-400 to-orange-400' : 'from-red-400 to-rose-400'
      }`}></div>

      {/* Baris Atas: Label & Ikon Terapung */}
      <div className="flex justify-between items-start gap-4 z-10">
        <div>
          <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200/10">
            {title}
          </span>
          <h3 className={`font-black mt-3 tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${textGradient} ${
            value && value.toString().length > 10 ? 'text-lg leading-tight mt-4' : 'text-3xl'
          }`}>
            {value}
          </h3>
        </div>
        <div className={`w-12 h-12 rounded-[16px_8px_16px_8px] bg-gradient-to-br flex items-center justify-center shrink-0 transition-transform duration-500 hover:scale-110 shadow-sm ${iconBgColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {/* Baris Bawah: Keterangan & Badge Status Dinamis */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-150/40 z-10">
        <span className="text-[10px] text-slate-400 font-bold tracking-wide flex items-center gap-1.5">
          {/* Pulsing Live Dot */}
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotPingColor}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${dotPingColor}`}></span>
          </span>
          {subtext}
        </span>
        
        <span className={`text-[9px] uppercase font-extrabold tracking-widest px-3 py-1 rounded-full border shadow-sm ${badgeColor}`}>
          {badgeText}
        </span>
      </div>

    </div>
  );
}
