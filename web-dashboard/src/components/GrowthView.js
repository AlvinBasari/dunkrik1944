import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Activity, 
  HelpCircle, 
  Scale, 
  Award,
  AlertCircle,
  FlaskConical,
  Pencil
} from 'lucide-react';

export default function GrowthView({ settings, history }) {
  
  // ============================================
  // INPUT MANUAL PAKAN (opsional dari peternak)
  // ============================================
  const [pakanPerHari, setPakanPerHari] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);

  // ============================================
  // PENGHITUNG UMUR AYAM
  // ============================================
  const calculateAge = () => {
    if (!settings || !settings.chickInDate) return 0;
    const start = new Date(settings.chickInDate);
    const now = new Date();
    const diff = now - start;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const age = calculateAge();
  const jumlahAyam = settings?.jumlahAyam || 100;

  // ============================================
  // KURVA PERTUMBUHAN COBB 500 (INTERPOLASI)
  // Sumber: Cobb-Vantress Broiler Performance & Nutrition Supplement
  // ============================================
  const getStandardWeight = (chickAge) => {
    if (chickAge <= 0) return 42;
    if (chickAge <= 7) return Math.round(42 + (180 - 42) * (chickAge / 7));
    if (chickAge <= 14) return Math.round(180 + (480 - 180) * ((chickAge - 7) / 7));
    if (chickAge <= 21) return Math.round(480 + (950 - 480) * ((chickAge - 14) / 7));
    if (chickAge <= 28) return Math.round(950 + (1550 - 950) * ((chickAge - 21) / 7));
    if (chickAge <= 35) return Math.round(1550 + (2200 - 1550) * ((chickAge - 28) / 7));
    return Math.round(2200 + (chickAge - 35) * 80);
  };

  const stdWeight = getStandardWeight(age);

  // ============================================
  // KALKULATOR FCR DAN DAMPAK FINANSIAL SENSOR IoT
  // ============================================
  const analyzeFcr = () => {
    if (!history || history.length === 0) {
      return { fcr: 1.45, penalty: 0, actualWeight: stdWeight, wastedFeed: 0, wastedCost: 0, status: 'optimal', mode: 'estimasi' };
    }

    // Hitung rata-rata parameter sensor
    let sumHsi = 0;
    let sumGas = 0;
    
    history.forEach(item => {
      const f = item.suhu * 1.8 + 32;
      sumHsi += (f + item.kelembaban);
      sumGas += item.gas;
    });

    const avgHsi = sumHsi / history.length;
    const avgGas = sumGas / history.length;

    // Hitung Penalti FCR dari Sensor
    // Referensi: Mujahid et al. (2007) Heat stress FCR impact; Miles et al. (2004) Ammonia FCR impact
    let hsiPenalty = 0;
    let gasPenalty = 0;

    if (avgHsi >= 160) {
      hsiPenalty = 0.22;
    } else if (avgHsi >= 155) {
      hsiPenalty = 0.08;
    }

    if (avgGas >= 1500) {
      gasPenalty = 0.15;
    } else if (avgGas >= 800) {
      gasPenalty = 0.05;
    }

    const totalPenalty = hsiPenalty + gasPenalty;
    const actualFcr = parseFloat((1.45 + totalPenalty).toFixed(2));
    
    const growthReductionFactor = 1 - (totalPenalty * 0.4); 
    const actualWeight = Math.round(stdWeight * growthReductionFactor);

    // ============================================
    // MODE NYATA: Jika peternak input pakan per hari
    // ============================================
    if (isManualMode && pakanPerHari && parseFloat(pakanPerHari) > 0) {
      const pakanHariIni = parseFloat(pakanPerHari); // kg/hari (total seluruh kandang)
      const totalPakanTerpakai = pakanHariIni * age; // kg total sejak DOC masuk
      const totalBeratKandang = (actualWeight / 1000) * jumlahAyam; // kg biomassa
      
      const realFcr = totalBeratKandang > 0 
        ? parseFloat((totalPakanTerpakai / totalBeratKandang).toFixed(2)) 
        : actualFcr;
      
      // Pakan terbuang = selisih dari FCR target 1.45
      const pakanIdeal = totalBeratKandang * 1.45;
      const wastedFeedReal = Math.max(0, parseFloat((totalPakanTerpakai - pakanIdeal).toFixed(2)));
      const wastedCostReal = Math.round(wastedFeedReal * 12000);

      let statusReal = 'optimal';
      if (realFcr >= 1.7) statusReal = 'critical';
      else if (realFcr > 1.45) statusReal = 'warning';

      return {
        fcr: realFcr,
        penalty: totalPenalty,
        actualWeight,
        wastedFeed: wastedFeedReal,
        wastedCost: wastedCostReal,
        status: statusReal,
        mode: 'nyata',
        pakanHariIni,
        totalPakanTerpakai: parseFloat(totalPakanTerpakai.toFixed(1))
      };
    }

    // ============================================
    // MODE ESTIMASI: Tidak ada input pakan
    // ============================================
    const weightKg = actualWeight / 1000;
    const wastedFeed = parseFloat((jumlahAyam * weightKg * totalPenalty).toFixed(2));
    const wastedCost = Math.round(wastedFeed * 12000);

    let status = 'optimal';
    if (actualFcr >= 1.7) status = 'critical';
    else if (actualFcr > 1.45) status = 'warning';

    return {
      fcr: actualFcr,
      penalty: totalPenalty,
      actualWeight,
      wastedFeed,
      wastedCost,
      status,
      mode: 'estimasi'
    };
  };

  const fcrData = analyzeFcr();

  // ============================================
  // PLOTTING DATA GRAFIK (Cobb 500 vs Aktual)
  // ============================================
  const generateChartData = () => {
    const data = [];
    const limit = Math.max(35, age + 5);
    
    for (let d = 0; d <= limit; d += 7) {
      const targetW = getStandardWeight(d);
      const reduction = 1 - (fcrData.penalty * 0.4);
      const actualW = Math.round(targetW * (d <= age ? reduction : 1));

      data.push({
        day: `Hari ${d}`,
        Target: targetW,
        Aktual: d <= age ? actualW : null
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-8 animate-fadeIn">

      {/* BANNER INPUT PAKAN MANUAL */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-all duration-300 ${
        isManualMode 
          ? 'bg-teal-50/40 border-teal-300/40' 
          : 'bg-amber-50/30 border-amber-200/40'
      }`}>
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            isManualMode ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isManualMode ? <Pencil className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
          </div>
          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-wider ${isManualMode ? 'text-teal-800' : 'text-amber-800'}`}>
              {isManualMode ? '✅ Mode Data Nyata — FCR dihitung dari input pakan Anda' : '⚠️ Mode Estimasi — FCR dihitung dari referensi kurva Cobb 500 & penalti sensor IoT'}
            </p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
              {isManualMode 
                ? 'Masukkan jumlah pakan yang diberikan per hari (kg total seluruh kandang) untuk kalkulasi FCR akurat.'
                : 'Tidak ada sensor pakan. FCR & pakan terbuang adalah PROYEKSI berdasarkan standar industri Cobb 500 dan data kondisi lingkungan sensor IoT Anda.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto">
          {isManualMode && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                value={pakanPerHari}
                onChange={(e) => setPakanPerHari(e.target.value)}
                placeholder="Contoh: 45"
                className="w-32 px-3 py-1.5 text-xs rounded-xl border border-teal-300/60 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 bg-white text-slate-800 shadow-sm"
              />
              <span className="text-[10px] font-bold text-teal-700">kg/hari</span>
            </div>
          )}
          <button
            onClick={() => { setIsManualMode(!isManualMode); if (isManualMode) setPakanPerHari(''); }}
            className={`text-[10px] font-bold px-3 py-1.5 rounded-xl border transition-all ${
              isManualMode 
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700'
            }`}
          >
            {isManualMode ? 'Kembali ke Estimasi' : 'Input Data Pakan Nyata'}
          </button>
        </div>
      </div>
      
      {/* ATAS: GRID KARTU FINANSIAL & METRIK (FCR, Weight, Wasted) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KARTU FCR AKTUAL VS TARGET */}
        <div className="glass-card rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-teal-50/15 border border-teal-500/10 shadow-[0_12px_24px_rgba(4,47,46,0.018)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-teal-150/40">
            <Scale className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feed Conversion Ratio (FCR)</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">
              {fcrData.fcr} 
              <span className="text-xs font-bold text-slate-450 ml-1.5">(Target: 1.45)</span>
            </h4>
            <p className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">
              {fcrData.status === 'optimal' 
                ? '🟢 Sangat Efisien' 
                : fcrData.status === 'warning' 
                ? '🟡 Pemborosan Ringan' 
                : '🔴 Pemborosan Kritis'}
            </p>
            <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${
              fcrData.mode === 'nyata' 
                ? 'bg-teal-100 text-teal-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {fcrData.mode === 'nyata' ? '📊 Data Nyata' : '🔬 Proyeksi Estimasi'}
            </span>
          </div>
        </div>

        {/* KARTU BOBOT EKOR & TOTAL BIOMASSA */}
        <div className="glass-card rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-teal-50/15 border border-teal-500/10 shadow-[0_12px_24px_rgba(4,47,46,0.018)] p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border border-amber-150/40">
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bobot Rata-rata / Ekor</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">
              {fcrData.actualWeight} Gram
              {fcrData.actualWeight < stdWeight && (
                <span className="text-[10px] font-extrabold text-red-500 ml-1.5">(-{stdWeight - fcrData.actualWeight}g)</span>
              )}
            </h4>
            <p className="text-[9px] text-slate-455 font-bold mt-0.5">
              Total Biomassa: {((fcrData.actualWeight * jumlahAyam) / 1000).toFixed(1)} kg ({jumlahAyam} Ekor)
            </p>
            <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block bg-amber-100 text-amber-700">
              🔬 Proyeksi Kurva Cobb 500
            </span>
          </div>
        </div>

        {/* KARTU PAKAN MUBAZIR (RUPIAH YANG HILANG) */}
        <div className="glass-card rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-teal-50/15 border border-teal-500/10 shadow-[0_12px_24px_rgba(4,47,46,0.018)] p-6 flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border ${
            fcrData.wastedCost > 0 
              ? 'bg-red-50 text-red-650 border-red-150/45 animate-pulse' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-150/45'
          }`}>
            <DollarSign className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kerugian Pakan Mubazir</p>
            <h4 className={`text-xl font-black mt-1 ${fcrData.wastedCost > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              Rp {fcrData.wastedCost.toLocaleString('id-ID')}
            </h4>
            <p className="text-[9px] text-slate-455 font-bold mt-0.5">
              Pakan Terbuang: {fcrData.wastedFeed} kg
              {fcrData.mode === 'nyata' && fcrData.totalPakanTerpakai && (
                <span className="ml-1 text-teal-600"> (Total diberikan: {fcrData.totalPakanTerpakai} kg)</span>
              )}
            </p>
            <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${
              fcrData.mode === 'nyata' 
                ? 'bg-teal-100 text-teal-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {fcrData.mode === 'nyata' ? '📊 Dari Input Pakan Nyata' : '🔬 Proyeksi Estimasi Sensor'}
            </span>
          </div>
        </div>

      </div>

      {/* DUA KOLOM: GRAFIK KURVA PERTUMBUHAN vs DIAGNOSA IoT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRAPH (2/3 width) */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-2 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-teal-600" /> Kurva Pertumbuhan Broiler Cobb 500 (Gram)
          </h4>
          <p className="text-[9px] text-amber-700 font-bold uppercase tracking-wider mb-5 bg-amber-50/50 border border-amber-200/40 px-2.5 py-1 rounded-lg inline-block">
            🔬 Proyeksi — Berdasarkan standar Cobb-Vantress, bukan timbangan sensor
          </p>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} dx={-5} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="Target" 
                  name="Target Cobb 500"
                  stroke="#94a3b8" 
                  strokeDasharray="4 4"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Aktual" 
                  name="Estimasi Aktual (dengan penalti stres)"
                  stroke="#0d9488" 
                  strokeWidth={3}
                  dot={{ stroke: '#0d9488', strokeWidth: 2, r: 4, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DIAGNOSA FINANSIAL & VETERINER (1/3 width) */}
        <div className="lg:col-span-1 glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)] flex flex-col justify-between">
          <div>
            <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-teal-650" /> Pengaruh Stres Lingkungan
            </h5>
            
            <div className="text-[11px] text-slate-650 leading-relaxed font-medium space-y-4">
              <p>
                Ayam broiler yang stres karena panas (<strong className="font-bold text-teal-800">HSI &ge; 155</strong>) atau amonia tinggi (<strong className="font-bold text-teal-800">Gas &ge; 800 ppm</strong>) akan membakar kalori pakan untuk pendinginan tubuh alami, bukan untuk memproduksi daging.
              </p>
              
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/50 space-y-1">
                <p className="font-extrabold text-slate-800">Status Stres Hari Ini:</p>
                {fcrData.penalty > 0 ? (
                  <p className="text-red-600 font-bold">
                    ⚠️ Terdeteksi stres lingkungan! FCR Anda membengkak sebesar <strong className="font-extrabold">+{fcrData.penalty}</strong>.
                  </p>
                ) : (
                  <p className="text-teal-700 font-bold">
                    ✅ Lingkungan kandang aman & sejuk. Konversi pakan bekerja optimal!
                  </p>
                )}
              </div>

              {/* METODOLOGI TRANSPARAN */}
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/30 text-[10px] text-amber-800">
                <p className="font-extrabold mb-1">📚 Sumber Metodologi:</p>
                <p className="font-medium leading-relaxed">Penalti FCR dihitung berdasarkan referensi: <strong>Mujahid et al. (2007)</strong> untuk heat stress dan <strong>Miles et al. (2004)</strong> untuk amonia. Kurva bobot dari <strong>Cobb-Vantress Broiler Guide</strong>. Gunakan input pakan nyata untuk hasil lebih akurat.</p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-teal-50/30 border border-teal-150/45 text-[10px] font-bold text-teal-850 leading-relaxed">
            💡 <strong className="font-bold text-teal-900">Rekomendasi Peternak</strong>:
            {fcrData.penalty > 0 
              ? ' Turunkan suhu dengan blower dan bersihkan sekam basah segera untuk menghentikan pemborosan biaya pakan.'
              : ' Pertahankan kondisi nyaman ini untuk mencapai target bobot panen tepat waktu.'}
          </div>
        </div>

      </div>

    </div>
  );
}
