import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  HelpCircle, 
  Database, 
  Save 
} from 'lucide-react';

export default function PopulationView({
  settings,
  isSavingSettings,
  onUpdateSettings
}) {
  const [formJumlahAyam, setFormJumlahAyam] = useState(1250);
  const [formTanggalMasuk, setFormTanggalMasuk] = useState('');
  const [formVarietasAyam, setFormVarietasAyam] = useState('Broiler');
  const [formSiklusPanen, setFormSiklusPanen] = useState(35);
  const [isTouched, setIsTouched] = useState(false);

  // Sinkronisasi data form ketika settings di-load
  useEffect(() => {
    if (settings && !isTouched) {
      setFormJumlahAyam(settings.jumlahAyam);
      setFormTanggalMasuk(settings.tanggalMasuk);
      setFormVarietasAyam(settings.varietasAyam);
      setFormSiklusPanen(settings.siklusPanen);
    }
  }, [settings, isTouched]);

  // Handler sinkronisasi varietas otomatis
  const handleVarietasChange = (varietas) => {
    setIsTouched(true);
    setFormVarietasAyam(varietas);
    if (varietas === 'Broiler') {
      setFormSiklusPanen(35);
    } else if (varietas === 'Ayam Kampung') {
      setFormSiklusPanen(60);
    } else if (varietas === 'Petelur (Layer)') {
      setFormSiklusPanen(120);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsTouched(false);
    onUpdateSettings({
      jumlahAyam: parseInt(formJumlahAyam),
      tanggalMasuk: formTanggalMasuk,
      varietasAyam: formVarietasAyam,
      siklusPanen: parseInt(formSiklusPanen)
    });
  };

  // ============================================
  // PENGHITUNG DINAMIS POPULASI & PANEN
  // ============================================
  const calculatePopulasiStats = () => {
    if (!settings || !settings.tanggalMasuk) {
      return { umur: 0, tglPanen: '-', sisaHari: 0, progress: 0 };
    }

    const tglMasuk = new Date(settings.tanggalMasuk);
    const tglSekarang = new Date();
    
    tglMasuk.setHours(0, 0, 0, 0);
    tglSekarang.setHours(0, 0, 0, 0);
    
    const diffTime = tglSekarang - tglMasuk;
    let umur = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    if (umur < 0) umur = 0;

    const tglPanenObj = new Date(tglMasuk);
    tglPanenObj.setDate(tglPanenObj.getDate() + parseInt(settings.siklusPanen || 35));
    const tglPanenStr = tglPanenObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const diffPanen = tglPanenObj - tglSekarang;
    const sisaHari = Math.ceil(diffPanen / (1000 * 60 * 60 * 24));

    const progress = Math.min(100, Math.max(0, (umur / parseInt(settings.siklusPanen || 35)) * 100));

    return { umur, tglPanen: tglPanenStr, sisaHari, progress };
  };

  const popStats = calculatePopulasiStats();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
      
      {/* LEFT: VISUALISASI STATUS SIKLUS (2/3 width) */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* CARD UTAMA SIKLUS PANEN */}
        <div className="glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)] relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-teal-500/5 rounded-full -z-10 opacity-60"></div>
          
          <h3 className="text-sm font-extrabold text-slate-800 mb-6 flex items-center gap-2 tracking-tight">
            <Calendar className="w-5 h-5 text-teal-600 animate-pulse" /> Ringkasan Siklus Berjalan
          </h3>

          {/* GRID METRIK POPULASI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/90 p-4 rounded-2xl border border-teal-500/10 shadow-[0_4px_12px_rgba(4,47,46,0.01)] hover:border-teal-400/30 transition-all duration-300">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Umur Ayam</p>
              <h4 className="text-2xl font-black text-teal-600 mt-1">{popStats.umur} Hari</h4>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-teal-500/10 shadow-[0_4px_12px_rgba(4,47,46,0.01)] hover:border-teal-400/30 transition-all duration-300">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Total Ayam</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{settings?.jumlahAyam || 0} ekor</h4>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-teal-500/10 shadow-[0_4px_12px_rgba(4,47,46,0.01)] hover:border-teal-400/30 transition-all duration-300">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Siklus Target</p>
              <h4 className="text-2xl font-black text-slate-800 mt-1">{settings?.siklusPanen || 35} Hari</h4>
            </div>

            <div className="bg-white/90 p-4 rounded-2xl border border-teal-500/10 shadow-[0_4px_12px_rgba(4,47,46,0.01)] hover:border-teal-400/30 transition-all duration-300">
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Varietas</p>
              <h4 className="text-xs font-black text-slate-805 mt-2.5 truncate" title={settings?.varietasAyam}>
                {settings?.varietasAyam || 'Broiler'}
              </h4>
            </div>
          </div>

          {/* PROGRESS BAR */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-slate-400">Progres Siklus Pertumbuhan</span>
              <span className="text-teal-650 font-black">{popStats.progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-slate-100/80 h-3 rounded-full overflow-hidden border border-teal-500/10 shadow-inner">
              <div 
                className="bg-gradient-to-r from-teal-600 to-teal-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${popStats.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[10px] text-slate-400 font-bold pt-1">
              <span>Hari Ke-0 (DOC)</span>
              <span>Target Panen (Hari ke-{settings?.siklusPanen})</span>
            </div>
          </div>
        </div>

        {/* COUNTDOWN WAKTU PANEN */}
        <div className="glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)] flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <h4 className="font-extrabold text-slate-800 tracking-tight">Estimasi Tanggal Panen</h4>
            <p className="text-xs text-slate-400 mt-1">Berdasarkan tanggal kedatangan DOC dan target siklus varietas ayam</p>
            <div className="text-base font-black text-teal-605 mt-2.5">
              📅 {popStats.tglPanen}
            </div>
          </div>
          
          <div className={`p-4 rounded-2xl border text-center font-bold sm:w-48 shadow-sm ${
            popStats.sisaHari > 5
              ? 'bg-teal-50/50 border-teal-200/40 text-teal-700'
              : popStats.sisaHari > 0
              ? 'bg-amber-50/50 border-amber-200/40 text-amber-700'
              : popStats.sisaHari === 0
              ? 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white border-emerald-600 animate-pulse'
              : 'bg-red-50/50 border-red-200/40 text-red-700'
          }`}>
            <p className="text-[9px] uppercase tracking-widest opacity-80 font-black">Sisa Waktu Panen</p>
            <h5 className="text-lg font-black mt-1">
              {popStats.sisaHari > 0 
                ? `${popStats.sisaHari} Hari Lagi`
                : popStats.sisaHari === 0
                ? '🐔 HARI INI PANEN!'
                : `Lewat ${Math.abs(popStats.sisaHari)} Hari`}
            </h5>
          </div>
        </div>

        {/* TIPS & INFO PETERNAKAN */}
        <div className="p-4 rounded-2xl bg-teal-50/30 border border-teal-100/40 flex items-start gap-3 shadow-sm">
          <HelpCircle className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-650 leading-relaxed font-medium">
            <p className="font-bold text-teal-900 mb-1 text-xs">💡 Tips Varietas & Siklus Panen</p>
            Umumnya ayam <strong className="font-bold text-teal-900">Broiler</strong> dipanen pada hari ke-30 hingga 35 untuk berat 1.5 - 2.0 kg. Untuk ayam <strong className="font-bold text-teal-900">Kampung</strong>, waktu panen biasanya berkisar antara 60 hingga 75 hari. Anda dapat mengubah jumlah hari siklus secara manual jika memiliki jenis bibit lokal yang unik atau menginginkan bobot ayam yang berbeda saat panen.
          </div>
        </div>

      </div>

      {/* RIGHT: FORM EDIT POPULASI (1/3 width) */}
      <div className="lg:col-span-1">
        <div className="glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
          <h4 className="font-bold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
            <Database className="w-4.5 h-4.5 text-teal-600 animate-bounce" /> Atur Siklus Baru
          </h4>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Jumlah Ayam */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Jumlah Bibit Ayam (Ekor)</label>
              <input 
                type="number" 
                required
                value={formJumlahAyam}
                onChange={(e) => {
                  setFormJumlahAyam(e.target.value);
                  setIsTouched(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 bg-white text-slate-800 transition-all shadow-sm"
                placeholder="Contoh: 1000"
                min="1"
              />
            </div>

            {/* Tanggal Masuk */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Tanggal DOC Masuk</label>
              <input 
                type="date" 
                required
                value={formTanggalMasuk}
                onChange={(e) => {
                  setFormTanggalMasuk(e.target.value);
                  setIsTouched(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 bg-white text-slate-600 transition-all shadow-sm"
              />
            </div>

            {/* Varietas Ayam */}
            <div>
              <label className="block text-[10px] font-extrabold text-slate-450 uppercase tracking-wider mb-1.5">Varietas / Tipe Ayam</label>
              <select
                value={formVarietasAyam}
                onChange={(e) => handleVarietasChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm bg-white focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 text-slate-650 transition-all shadow-sm"
              >
                <option value="Broiler">Broiler (DOC Pedaging Standard)</option>
                <option value="Ayam Kampung">Ayam Kampung (DOC Lokal)</option>
                <option value="Petelur (Layer)">Petelur (Layer Pullet)</option>
                <option value="Varietas Unik (Lainnya)">Varietas Unik (Custom)</option>
              </select>
            </div>

            {/* Siklus Panen Target */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-extrabold text-slate-455 uppercase tracking-wider">Target Siklus Panen (Hari)</label>
                {formVarietasAyam !== 'Varietas Unik (Lainnya)' && (
                  <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">Rekomendasi</span>
                )}
              </div>
              <input 
                type="number" 
                required
                value={formSiklusPanen}
                onChange={(e) => {
                  setFormSiklusPanen(e.target.value);
                  setIsTouched(true);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200/80 text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 bg-white text-slate-800 transition-all shadow-sm"
                placeholder="Contoh: 35"
                min="1"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-teal-600/15 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-3 flex items-center justify-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Simpan & Terapkan</span>
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
