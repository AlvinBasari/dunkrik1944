import React from 'react';
import { 
  Heart, 
  Activity, 
  HelpCircle, 
  ShieldCheck, 
  TrendingUp, 
  Moon, 
  Sun,
  AlertTriangle
} from 'lucide-react';

export default function HealthView({ telemetry, settings, history, isMassMortalityAlert }) {
  
  // ============================================
  // ANALISIS VITALITAS SIANG & MALAM (PIR PATTERNS)
  // ============================================
  const analyzeVitality = () => {
    if (isMassMortalityAlert) {
      return {
        daytimeRatio: 0,
        nighttimeRatio: 0,
        status: 'danger',
        label: 'DARURAT: POTENSI KEMATIAN MASSAL / SENSOR LEPAS 🚨',
        recommendation: '🚨 ALARM KRITIS: Sistem mendeteksi tidak ada pergerakan ayam sama sekali selama siang hari pada jendela waktu pemantauan. Segera kunjungi kandang maket fisik Anda untuk memeriksa kelangsungan hidup ayam (potensi mati lemas/keracunan amonia) ATAU periksa koneksi kabel pin sensor PIR Anda!'
      };
    }

    if (!history || history.length === 0) {
      return { daytimeRatio: 65, nighttimeRatio: 5, status: 'safe', label: 'Memuat...', recommendation: 'Menunggu telemetri...' };
    }

    let dayTotal = 0;
    let dayActive = 0;
    let nightTotal = 0;
    let nightActive = 0;

    history.forEach(item => {
      const dateObj = new Date(item.timestamp);
      const hour = dateObj.getHours();
      const isNight = hour >= 19 || hour < 5;

      if (isNight) {
        nightTotal++;
        if (item.gerakan) nightActive++;
      } else {
        dayTotal++;
        if (item.gerakan) dayActive++;
      }
    });

    // Hitung persentase. Jika data salah satu zona 0 (karena histori pendek), gunakan nilai aman/default
    const daytimeRatio = dayTotal > 0 ? Math.round((dayActive / dayTotal) * 100) : 45;
    const nighttimeRatio = nightTotal > 0 ? Math.round((nightActive / nightTotal) * 100) : 5;

    // Tentukan Diagnosa & Rekomendasi
    let status = 'safe';
    let label = 'Ayam Sehat & Lincah';
    let recommendation = 'Kondisi keaktifan ayam sangat baik. Pertahankan suhu optimal dan pakan yang mengalir lancar.';

    // Check untuk kelesuan siang hari
    if (daytimeRatio < 15) {
      status = 'danger';
      label = 'Waspada Kelesuan Ayam (Lethargic)';
      
      // Hubungkan dengan sensor lain untuk diagnosa cerdas
      if (telemetry && telemetry.suhu >= (settings?.suhuThreshold || 32.0)) {
        recommendation = '⚠️ Deteksi Kelesuan: Suhu kandang terlalu tinggi (Panas). Ayam broiler mengalami heat stress parah sehingga mogok makan dan malas bergerak. Disarankan untuk memicu blower Kipas ON penuh untuk mendinginkan area.';
      } else if (telemetry && telemetry.gas >= (settings?.gasThreshold || 1500)) {
        recommendation = '⚠️ Deteksi Kelesuan: Kadar gas amonia tinggi menyebabkan udara sesak dan mengiritasi saluran napas ayam. Bersihkan alas sekam basah atau paksa kipas ON untuk ventilasi.';
      } else {
        recommendation = '⚠️ Deteksi Kelesuan: Parameter lingkungan normal namun ayam terdeteksi diam/inaktif. Harap periksa bibit secara klinis di maket untuk memastikan tidak ada indikasi awal penyakit/pilek ayam.';
      }
    } 
    // Check untuk kegelisahan malam hari
    else if (nighttimeRatio >= 25) {
      status = 'warning';
      label = 'Ayam Gelisah Malam Hari (Restless)';
      recommendation = '⚠️ Deteksi Kegelisahan Malam: Ayam terdeteksi banyak bergerak di jam tidurnya. Ini bisa dipicu oleh suhu yang terlalu dingin (Lampu Pemanas mati), suara bising eksternal, atau ancaman predator/hama di malam hari.';
    }

    return {
      daytimeRatio,
      nighttimeRatio,
      status,
      label,
      recommendation
    };
  };

  const health = analyzeVitality();

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* VERDIK UTAMA STATUS KESEHATAN */}
      <div className="glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute right-0 top-0 w-32 h-32 bg-teal-500/5 rounded-full -z-10 blur-xl"></div>
        
        <div className="space-y-2 text-center md:text-left">
          <span className="text-[9px] font-black text-slate-450 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border">
            VERDIK SISTEM DIAGNOSA
          </span>
          <h3 className="text-xl font-black text-slate-800 tracking-tight">{health.label}</h3>
          <p className="text-xs text-slate-500 font-medium">Berdasarkan analisis frekuensi gerakan PIR sensor siang vs malam hari</p>
        </div>

        <div className={`p-4 rounded-xl border text-center font-bold min-w-[200px] shadow-sm ${
          health.status === 'safe' 
            ? 'bg-teal-50 border-teal-150 text-teal-700' 
            : health.status === 'warning' 
            ? 'bg-amber-55 border-amber-150 text-amber-700' 
            : 'bg-red-50 border-red-150 text-red-700 font-black animate-pulse'
        }`}>
          <span className="text-[9px] uppercase tracking-wider opacity-85">Kondisi Vitalitas</span>
          <h4 className="text-base font-black mt-1 uppercase">
            {isMassMortalityAlert 
              ? '🚨 MATI MASSAL'
              : health.status === 'safe' 
              ? '🟢 SEHAT / AKTIF' 
              : health.status === 'warning' 
              ? '🟡 GEJALA STRES' 
              : '🔴 WASPADA SAKIT'}
          </h4>
        </div>
      </div>

      {/* DETEKSI PERSENTASE AKTIVITAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KARTU AKTIVITAS SIANG (Sun) */}
        <div className="glass-card p-6 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold shadow-sm">
                <Sun className="w-5.5 h-5.5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-850 tracking-tight">Vitalitas Siang Hari</h4>
                <p className="text-[10px] text-slate-400 font-medium">Normal: &ge; 30% Keaktifan</p>
              </div>
            </div>
            
            <span className={`text-2xl font-black ${isMassMortalityAlert ? 'text-red-650' : health.daytimeRatio >= 30 ? 'text-teal-600' : 'text-amber-600'}`}>
              {health.daytimeRatio}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${isMassMortalityAlert ? 'bg-red-500' : 'bg-amber-500'}`} 
                style={{ width: `${health.daytimeRatio}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-455 font-bold leading-normal pt-1">
              Ayam harus aktif bergerak di siang hari saat pemberian makan untuk memastikan bobot bertambah secara berkala.
            </p>
          </div>
        </div>

        {/* KARTU AKTIVITAS MALAM (Moon) */}
        <div className="glass-card p-6 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-650 rounded-xl flex items-center justify-center font-bold shadow-sm">
                <Moon className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-850 tracking-tight">Kegelisahan Malam Hari</h4>
                <p className="text-[10px] text-slate-400 font-medium">Normal: &lt; 10% Gerakan</p>
              </div>
            </div>
            
            <span className={`text-2xl font-black ${isMassMortalityAlert ? 'text-slate-400' : health.nighttimeRatio >= 25 ? 'text-red-500' : 'text-teal-600'}`}>
              {health.nighttimeRatio}%
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/50">
              <div 
                className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                style={{ width: `${health.nighttimeRatio}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-slate-455 font-bold leading-normal pt-1">
              Ayam yang gelisah di malam hari membakar energi yang seharusnya disimpan untuk pertumbuhan daging, berisiko menurunkan FCR (*Feed Conversion Ratio*).
            </p>
          </div>
        </div>

      </div>

      {/* SMART DIAGNOSTICS & RECOMMENDATIONS */}
      <div className={`p-6 rounded-[32px_12px_32px_12px] border text-xs text-slate-700 leading-relaxed shadow-sm flex items-start gap-4 ${
        isMassMortalityAlert 
          ? 'bg-red-50 border-red-200 text-red-950 font-semibold' 
          : 'bg-teal-50/40 border-teal-150/45'
      }`}>
        <AlertTriangle className={`w-5.5 h-5.5 mt-0.5 shrink-0 ${isMassMortalityAlert ? 'text-red-600' : 'text-teal-600'}`} />
        <div className="space-y-2">
          <p className={`font-extrabold text-xs ${isMassMortalityAlert ? 'text-red-900' : 'text-teal-900'}`}>
            {isMassMortalityAlert ? '🚨 DIAGNOSA DARURAT (KEMATIAN MASSAL / SENSOR COPOT)' : '💡 Diagnosa Otomatis & Rekomendasi Tindakan'}
          </p>
          <p className="font-medium leading-relaxed">{health.recommendation}</p>
        </div>
      </div>

    </div>
  );
}
