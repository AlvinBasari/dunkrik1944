import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  TrendingUp, 
  HelpCircle, 
  Clock, 
  Activity,
  Award
} from 'lucide-react';

export default function EnergyView({ history }) {
  const [customWatt, setCustomWatt] = useState(5);
  const [customTarif, setCustomTarif] = useState(1500);

  // Kalkulasi dasar durasi kipas dari history
  const calculateBaseDuration = () => {
    if (!history || history.length === 0) return 0;
    const total = history.length;
    const active = history.filter(item => item.kipas).length;
    return active / total; // rasio kerja (0 s/d 1)
  };

  const activeRatio = calculateBaseDuration();
  const dailyHours = parseFloat((activeRatio * 24).toFixed(1));

  // Fungsi penghitung biaya proyeksi dengan presisi desimal kWh tinggi untuk skala kecil
  const getProjections = (watt, tarif) => {
    const dailyKwh = parseFloat((dailyHours * (watt / 1000)).toFixed(4));
    const dailyCost = Math.round(dailyKwh * tarif);
    const weeklyCost = dailyCost * 7;
    const monthlyCost = dailyCost * 30;

    return {
      kwh: dailyKwh,
      daily: dailyCost,
      weekly: weeklyCost,
      monthly: monthlyCost
    };
  };

  const projections = getProjections(customWatt, customTarif);

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ATAS: METRIK RINGKASAN BIAYA PROYEKSI (Daily, Weekly, Monthly) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* HARIAN */}
        <div className="glass-card rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-teal-150/40">
            <Zap className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Harian</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">Rp {projections.daily.toLocaleString('id-ID')}</h4>
            <p className="text-[9px] text-slate-455 font-bold mt-0.5">Konsumsi: {projections.kwh} kWh/Hari</p>
          </div>
        </div>

        {/* MINGGUAN */}
        <div className="glass-card rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-amber-150/40">
            <TrendingUp className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Mingguan</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">Rp {projections.weekly.toLocaleString('id-ID')}</h4>
            <p className="text-[9px] text-slate-455 font-bold mt-0.5">Proyeksi 7 Hari Kerja</p>
          </div>
        </div>

        {/* BULANAN */}
        <div className="glass-card rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-emerald-150/40">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Estimasi Bulanan</p>
            <h4 className="text-xl font-black text-teal-600 mt-1">Rp {projections.monthly.toLocaleString('id-ID')}</h4>
            <p className="text-[9px] text-slate-455 font-bold mt-0.5">Proyeksi Siklus Tumbuh (30 Hari)</p>
          </div>
        </div>

      </div>

      {/* DUA KOLOM: KALKULATOR KUSTOM vs TIPS EFISIENSI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* INTERACTIVE SIMULATOR (2/3 width) */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)]">
          <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-teal-600" /> Simulator Biaya Listrik Kipas Pendingin (Miniatur DC)
          </h4>

          <div className="space-y-6">
            {/* Input Watt Kipas */}
            <div>
              <div className="flex justify-between items-center mb-2 font-bold text-xs text-slate-500">
                <span>Daya Motor Kipas DC (Watt)</span>
                <span className="text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-150/30">{customWatt} Watt</span>
              </div>
              <input
                type="range"
                min="1"
                max="25"
                step="1"
                value={customWatt}
                onChange={(e) => setCustomWatt(parseInt(e.target.value))}
                className="w-full accent-teal-600 bg-slate-100 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold">
                <span>1 Watt (Kipas DC Mainan)</span>
                <span>12 Watt (Kipas PC 12V)</span>
                <span>25 Watt (Kipas Maket Besar)</span>
              </div>
            </div>

            {/* Input Tarif PLN */}
            <div>
              <div className="flex justify-between items-center mb-2 font-bold text-xs text-slate-500">
                <span>Tarif Dasar Listrik PLN (Rp / kWh)</span>
                <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-150/30">Rp {customTarif}</span>
              </div>
              <input
                type="range"
                min="1000"
                max="2500"
                step="50"
                value={customTarif}
                onChange={(e) => setCustomTarif(parseInt(e.target.value))}
                className="w-full accent-amber-500 bg-slate-100 h-2 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-slate-400 mt-1.5 font-bold">
                <span>Rp 1.000 / kWh</span>
                <span>Rp 1.444 (Subsidi)</span>
                <span>Rp 2.500 / kWh</span>
              </div>
            </div>

            {/* Output Box */}
            <div className="bg-white/80 p-4.5 rounded-2xl border border-slate-200/50 shadow-inner text-xs leading-relaxed text-slate-650">
              <span className="font-extrabold text-slate-800">Rumus Kalkulasi: </span>
              Dengan durasi kipas menyala <strong className="font-extrabold text-teal-900">{dailyHours} Jam/Hari</strong> (berdasarkan sensor IoT), kipas miniatur berdaya <strong className="font-extrabold text-teal-900">{customWatt} W</strong> menghabiskan energi <strong className="font-extrabold text-teal-900">{projections.kwh} kWh</strong> per hari. Pada tarif <strong className="font-extrabold text-teal-900">Rp {customTarif}/kWh</strong>, proyeksi biaya bulanan Anda adalah <strong className="font-extrabold text-teal-900">Rp {projections.monthly.toLocaleString('id-ID')}</strong>.
            </div>
          </div>
        </div>

        {/* TIPS EFISIENSI DAYA (1/3 width) */}
        <div className="lg:col-span-1 glass-card p-6 rounded-[28px_12px_28px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-teal-650" /> Kipas Miniatur Maket IoT
            </h5>
            
            <ul className="space-y-4 text-[11px] text-slate-600 leading-relaxed font-semibold">
              <li className="flex gap-2">
                <span className="text-teal-600">✔</span>
                <span>
                  <strong className="font-bold text-teal-900">Skala Miniatur Terkalibrasi</strong>: Penggunaan daya disesuaikan dengan adaptor DC 5V-12V (maksimal 25 Watt) yang umum digunakan untuk maket kandang pintar.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-600">✔</span>
                <span>
                  <strong className="font-bold text-teal-900">Tarif Terjangkau</strong>: Karena konsumsi kipas DC maket sangat kecil, biaya harian berkisar di bawah Rp 200/hari, sangat aman untuk pengujian model berkelanjutan.
                </span>
              </li>
              <li className="flex gap-2">
                <span className="text-teal-600">✔</span>
                <span>
                  <strong className="font-bold text-teal-900">Hemat Energi</strong>: Sistem otomatisasi menghemat masa pakai dinamo motor kipas kecil Anda agar tidak cepat aus/panas.
                </span>
              </li>
            </ul>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-teal-50/30 border border-teal-150/45 text-[10px] font-bold text-teal-850 leading-relaxed">
            💡 <strong className="font-bold text-teal-900">Statistik Aktif</strong>: Kipas menyala rata-rata <strong className="font-extrabold">{(activeRatio * 100).toFixed(0)}%</strong> dari total waktu operasional kandang hari ini.
          </div>
        </div>

      </div>

    </div>
  );
}
