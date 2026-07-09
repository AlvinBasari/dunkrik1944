import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  ShieldAlert, 
  HeartPulse, 
  Heart, 
  Fan,
  Lightbulb,
  Bell
} from 'lucide-react';
import StatCard from './StatCard';
import ControlPanel from './ControlPanel';
import SensorChart from './SensorChart';

export default function MonitoringView({
  telemetry,
  settings,
  history,
  isSavingSettings,
  onUpdateSettings,
  isNightAlertActive,
  isMassMortalityAlert
}) {
  
  // ============================================
  // PENGHITUNG DINAMIS HEAT STRESS INDEX (HSI)
  // ============================================
  const calculateHsi = () => {
    if (!telemetry) return { val: 0, status: 'safe', label: 'Memuat...' };
    const suhuF = telemetry.suhu * 1.8 + 32;
    const val = parseFloat((suhuF + telemetry.kelembaban).toFixed(1));

    let status = 'safe';
    let label = 'Sangat Nyaman';

    if (val >= 160.0) {
      status = 'danger';
      label = 'Bahaya Heat Stroke!';
    } else if (val >= 155.0) {
      status = 'warning';
      label = 'Cekaman Awal (Hangat)';
    }

    return { val, status, label };
  };

  const hsiData = calculateHsi();

  // ============================================
  // PENGHITUNG DINAMIS ENERGI & BIAYA KIPAS MINI
  // ============================================
  const calculateEnergyCost = () => {
    if (!history || history.length === 0) {
      return { ratio: 0, hours: 0, kwh: 0, cost: 0 };
    }
    
    const totalRecords = history.length;
    const activeRecords = history.filter(item => item.kipas).length;
    
    const ratio = activeRecords / totalRecords; // rasio kerja (0 s/d 1)
    const hours = parseFloat((ratio * 24).toFixed(1)); // estimasi jam aktif per hari
    const kwh = parseFloat((hours * 0.005).toFixed(4)); // konsumsi energi harian (5 Watt = 0.005 kW)
    const cost = Math.round(kwh * 1500); // tarif listrik bisnis (Rp 1500 / kWh)
    
    return {
      ratio: Math.round(ratio * 100),
      hours,
      kwh,
      cost
    };
  };

  const energy = calculateEnergyCost();

  const getSuhuStatus = () => {
    if (!telemetry || !settings) return 'safe';
    if (telemetry.suhu >= settings.suhuThreshold + 3) return 'danger';
    if (telemetry.suhu >= settings.suhuThreshold) return 'warning';
    return 'safe';
  };

  const getGasStatus = () => {
    if (!telemetry || !settings) return 'safe';
    if (telemetry.gas >= settings.gasThreshold + 500) return 'danger';
    if (telemetry.gas >= settings.gasThreshold) return 'warning';
    return 'safe';
  };

  const getLembabStatus = () => {
    if (!telemetry) return 'safe';
    if (telemetry.kelembaban > 80 || telemetry.kelembaban < 50) return 'warning';
    return 'safe';
  };

  const getPirStatus = () => {
    if (isMassMortalityAlert) return 'danger';
    if (isNightAlertActive) return 'danger';
    return 'safe';
  };

  const getPirText = () => {
    if (isMassMortalityAlert) return 'MATI MASSAL! 🚨';
    if (isNightAlertActive) return 'Bahaya Predator! 🚨';
    return telemetry ? (telemetry.gerakan ? 'Aktif 🐔' : 'Sunyi 💤') : 'Memuat...';
  };

  const getPirSubtext = () => {
    if (isMassMortalityAlert) return 'Tidak ada pergerakan';
    if (isNightAlertActive) return 'PIR Malam Aktif!';
    return 'Sensor Gerak (PIR)';
  };

  // ============================================
  // LOGIKA SUBTEKS INFORMATIF SENSOR
  // ============================================
  const getBlowerSubtext = () => {
    if (!telemetry || !settings) return 'Mendeteksi sensor...';
    if (telemetry.kipas) {
      if (telemetry.suhu >= settings.suhuThreshold) {
        return `Aktif (Suhu ${telemetry.suhu}°C >= Thres ${settings.suhuThreshold}°C)`;
      }
      if (telemetry.gas >= settings.gasThreshold) {
        return `Aktif (Gas ${telemetry.gas} ppm >= Thres ${settings.gasThreshold} ppm)`;
      }
      return 'Aktif (Manual Paksa ON)';
    } else {
      if (settings.modeKipas === 2) return 'Mati (Manual Paksa OFF)';
      return `Mati (Suhu & Gas di bawah batas)`;
    }
  };

  const getLedSubtext = () => {
    if (!telemetry || !settings) return 'Mendeteksi sensor...';
    if (telemetry.led) {
      return `Aktif (Kadar Amonia ${telemetry.gas} ppm >= Thres ${settings.gasThreshold} ppm)`;
    }
    return `Mati (Gas amonia aman < ${settings.gasThreshold} ppm)`;
  };

  const getBuzzerSubtext = () => {
    if (!telemetry) return 'Mendeteksi sensor...';
    if (telemetry.buzzer) {
      if (isNightAlertActive) return 'BAHAYA PREDATOR! PIR Terpicu Jam Istirahat';
      return `BAHAYA GAS TOKSIK! Amonia ${telemetry.gas} ppm`;
    }
    return 'Siaga Aman (Belum Terpicu)';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 🚨 CRITICAL MASS MORTALITY ALERT BANNER */}
      {isMassMortalityAlert && (
        <div className="bg-red-600 text-white px-6 py-4 rounded-[28px_12px_28px_12px] shadow-lg shadow-red-600/30 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse border border-red-500 mt-2">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="text-xs uppercase font-black tracking-wider leading-none">ALARM KRITIS: POTENSI KEMATIAN MASSAL / SENSOR LEPAS</p>
              <p className="text-[10px] font-bold opacity-90 mt-1.5">Tidak terdeteksi adanya aktivitas gerakan ayam sama sekali selama siang hari pada jendela waktu pemantauan.</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest bg-red-800 px-4 py-1.5 rounded-xl border border-red-700/30">
            PANGGIL DOKTER / CEK KANDANG
          </span>
        </div>
      )}

      {/* 🚨 NIGHT SECURITY WARNING BANNER */}
      {!isMassMortalityAlert && isNightAlertActive && (
        <div className="bg-red-500 text-white px-6 py-4 rounded-[28px_12px_28px_12px] shadow-lg shadow-red-500/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse border border-red-400 mt-2">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="text-xs uppercase font-black tracking-wider leading-none">Peringatan Keamanan Malam Hari</p>
              <p className="text-[10px] font-bold opacity-90 mt-1.5">Terdeteksi gerakan mencurigakan di dalam kandang pada saat ayam beristirahat.</p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-black tracking-widest bg-red-700 px-4 py-1.5 rounded-xl border border-red-600/30">
            POTENSI PREDATOR / PENCURI
          </span>
        </div>
      )}

      {/* SENSOR GRID (5 columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          title="Suhu Kandang"
          value={telemetry ? `${telemetry.suhu}°C` : '--°C'}
          icon={Thermometer}
          status={getSuhuStatus()}
          subtext={settings ? `Target: < ${settings.suhuThreshold}°C` : 'Memuat...'}
          glow={telemetry?.suhu >= (settings?.suhuThreshold || 32.0)}
        />

        <StatCard 
          title="Kelembaban Udara"
          value={telemetry ? `${telemetry.kelembaban}%` : '--%'}
          icon={Droplets}
          status={getLembabStatus()}
          subtext="Batas Aman: 50% - 80%"
        />

        <StatCard 
          title="Kenyamanan HSI"
          value={telemetry ? `${hsiData.val}` : '---'}
          icon={Heart}
          status={hsiData.status}
          subtext={`Status: ${hsiData.label}`}
          glow={hsiData.status !== 'safe'}
        />

        <StatCard 
          title="Kadar Gas Amonia"
          value={telemetry ? `${telemetry.gas} ppm` : '-- ppm'}
          icon={ShieldAlert}
          status={getGasStatus()}
          subtext={settings ? `Threshold: ${settings.gasThreshold} ppm` : 'Memuat...'}
          glow={telemetry?.gas >= (settings?.gasThreshold || 1500)}
        />

        <StatCard 
          title="Aktifitas Ayam"
          value={getPirText()}
          icon={HeartPulse}
          status={getPirStatus()}
          subtext={getPirSubtext()}
          glow={isMassMortalityAlert || isNightAlertActive}
        />
      </div>

      {/* CONTROLS & CHARTS SECTION - HIGHLY BALANCED HEIGHT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI (1/3 WIDTH): KONTROL & EDUKASI */}
        <div className="lg:col-span-1 space-y-6">
          <ControlPanel 
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            isLoading={isSavingSettings}
          />

          {/* EDUCATIONAL POULTRY HSI INFO CARD */}
          <div className="p-5 rounded-[28px_12px_28px_12px] bg-teal-50/40 border border-teal-150/45 text-xs text-slate-650 leading-relaxed shadow-sm">
            <p className="font-extrabold text-teal-900 mb-1.5 flex items-center gap-1">
              💡 Indeks Cekaman Panas (HSI)
            </p>
            <p className="mb-2">
              Ayam broiler tidak memiliki kelenjar keringat dan membuang panas tubuh dengan cara megap-megap (*panting*).
            </p>
            <ul className="space-y-1 font-medium list-disc list-inside">
              <li><span className="font-bold text-teal-800">&lt; 155</span>: Kondisi nyaman & tumbuh optimal</li>
              <li><span className="font-bold text-amber-700">155 - 160</span>: Mulai hangat, butuh kipas bertiup</li>
              <li><span className="font-bold text-red-700">&ge; 160</span>: Risiko tinggi heat stroke mendadak</li>
            </ul>
          </div>
        </div>

        {/* KOLOM KANAN (2/3 WIDTH): WIDE AKTUAL PANEL & GRAPH */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* DYNAMIC AKTUAL STATE SUMMARY & ENERGY ESTIMATOR - SIDE BY SIDE (WIDE CARD) */}
          <div className="glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* SISI KIRI: AKTUATOR BERJALAN DENGAN SUBTEKS LOGIKA */}
              <div className="space-y-4">
                <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Fan className="w-3.5 h-3.5 text-teal-600 animate-[spin_4s_linear_infinite]" /> Status Aktuator IoT
                </h5>
                
                <div className="grid grid-cols-1 gap-3">
                  {/* BLOWER KIPAS */}
                  <div className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    telemetry?.kipas 
                      ? 'bg-teal-50/40 border-teal-150/40 shadow-sm' 
                      : 'bg-white/40 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        telemetry?.kipas 
                          ? 'bg-teal-500 text-white animate-[spin_3s_linear_infinite] shadow-md shadow-teal-500/20' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Fan className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">Exhaust Blower</p>
                        <p className="text-[9.5px] text-teal-700 font-extrabold mt-0.5">{getBlowerSubtext()}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      telemetry?.kipas 
                        ? 'bg-teal-100 text-teal-850 border-teal-200/20 animate-pulse' 
                        : 'bg-slate-100 text-slate-455 border-slate-200/10'
                    }`}>
                      {telemetry?.kipas ? 'BERPUTAR' : 'MATI'}
                    </span>
                  </div>

                  {/* LAMPU LED STATUS */}
                  <div className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    telemetry?.led 
                      ? 'bg-amber-50/40 border-amber-155/40 shadow-sm' 
                      : 'bg-white/40 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        telemetry?.led 
                          ? 'bg-amber-500 text-white animate-pulse shadow-md shadow-amber-500/20' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">LED Status Indikator</p>
                        <p className="text-[9.5px] text-amber-700 font-extrabold mt-0.5">{getLedSubtext()}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      telemetry?.led 
                        ? 'bg-amber-100 text-amber-850 border-amber-200/20' 
                        : 'bg-slate-100 text-slate-455 border-slate-200/10'
                    }`}>
                      {telemetry?.led ? 'HIDUP' : 'MATI'}
                    </span>
                  </div>

                  {/* BUZZER ALARM */}
                  <div className={`p-3 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                    telemetry?.buzzer 
                      ? 'bg-red-50/40 border-red-155/40 shadow-sm' 
                      : 'bg-white/40 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        telemetry?.buzzer 
                          ? 'bg-red-500 text-white animate-bounce shadow-md shadow-red-500/20' 
                          : 'bg-slate-100 text-slate-400'
                      }`}>
                        <Bell className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800">Sirine / Buzzer</p>
                        <p className="text-[9.5px] text-red-700 font-extrabold mt-0.5">{getBuzzerSubtext()}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                      telemetry?.buzzer 
                        ? 'bg-red-100 text-red-850 border-red-200/20' 
                        : 'bg-slate-100 text-slate-455 border-slate-200/10'
                    }`}>
                      {telemetry?.buzzer ? 'ALARM ON' : 'SUNYI'}
                    </span>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: ESTIMASI BIAYA LISTRIK OPERASIONAL (KIPAS MINI) */}
              <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-150/80 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                <div>
                  <h5 className="text-[10px] font-extrabold text-teal-700 uppercase tracking-widest flex items-center gap-1">
                    <span>⚡</span> Analisis Daya Kipas (5W)
                  </h5>
                  <p className="text-[9.5px] text-slate-400 font-bold mt-1.5">Estimasi konsumsi harian berdasarkan rasio keaktifan relay exhaust fan:</p>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-150/50 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                    <p className="text-slate-400 font-bold">Rasio Kerja (Duty)</p>
                    <p className="text-xs font-extrabold text-slate-800 mt-0.5">{energy.ratio}%</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-150/50 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                    <p className="text-slate-400 font-bold">Jam Kerja (Est)</p>
                    <p className="text-xs font-extrabold text-slate-800 mt-0.5">{energy.hours} Jam/Hari</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-150/50 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                    <p className="text-slate-400 font-bold">Daya kWh</p>
                    <p className="text-[10px] font-extrabold text-slate-800 mt-0.5">{energy.kwh} kWh/Hari</p>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-150/50 shadow-[0_2px_8px_rgba(0,0,0,0.005)]">
                    <p className="text-slate-400 font-bold">Biaya Listrik</p>
                    <p className="text-xs font-extrabold text-teal-600 mt-0.5">Rp {energy.cost.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              </div>
              
            </div>
          </div>

          <SensorChart history={history} />
        </div>
        
      </div>

    </div>
  );
}
