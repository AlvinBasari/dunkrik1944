import React, { useState, useEffect } from 'react';
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
  Pencil,
  Calculator,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Coins
} from 'lucide-react';

export default function GrowthView({ settings, history }) {
  
  // ============================================
  // INPUT MANUAL PAKAN & HARGA PAKAN & STATE HITUNG FCR
  // ============================================
  const [inputPakan, setInputPakan] = useState('');
  const [activePakan, setActivePakan] = useState('');
  const [hargaPakan, setHargaPakan] = useState(settings?.hargaPakan || 12000);
  const [isManualMode, setIsManualMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);

  useEffect(() => {
    if (settings?.hargaPakan) {
      setHargaPakan(settings.hargaPakan);
    }
  }, [settings?.hargaPakan]);

  const handleCalculateFcr = (e) => {
    if (e) e.preventDefault();
    if (!inputPakan || parseFloat(inputPakan) <= 0) return;
    setActivePakan(inputPakan);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleToggleMode = () => {
    const nextMode = !isManualMode;
    setIsManualMode(nextMode);
    if (!nextMode) {
      setInputPakan('');
      setActivePakan('');
    }
  };

  // ============================================
  // PENGHITUNG UMUR AYAM
  // ============================================
  const calculateAge = () => {
    const dateStr = settings?.tanggalMasuk || settings?.chickInDate;
    if (!dateStr) return 0;
    const start = new Date(dateStr);
    const now = new Date();
    start.setHours(0, 0, 0, 0);
    now.setHours(0, 0, 0, 0);
    const diff = now - start;
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const age = calculateAge();
  const jumlahAyam = settings?.jumlahAyam || 1250;
  const currentFeedPrice = parseFloat(hargaPakan) || 12000;

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
    // MODE NYATA: Jika peternak input pakan per hari & menekan tombol Hitung
    // ============================================
    if (isManualMode && activePakan && parseFloat(activePakan) > 0) {
      const pakanHariIni = parseFloat(activePakan); // kg/hari (total seluruh kandang)
      const totalPakanTerpakai = pakanHariIni * (age || 1); // kg total sejak DOC masuk
      const totalBeratKandang = (actualWeight / 1000) * jumlahAyam; // kg biomassa
      
      const realFcr = totalBeratKandang > 0 
        ? parseFloat((totalPakanTerpakai / totalBeratKandang).toFixed(2)) 
        : actualFcr;
      
      // Pakan terbuang = selisih dari FCR target 1.45
      const pakanIdeal = totalBeratKandang * 1.45;
      const wastedFeedReal = Math.max(0, parseFloat((totalPakanTerpakai - pakanIdeal).toFixed(2)));
      const wastedCostReal = Math.round(wastedFeedReal * currentFeedPrice);

      let statusReal = 'optimal';
      if (realFcr < 1.25) {
        statusReal = 'abnormal_low'; // Pakan sangat kurang / ayam terancam kelaparan
      } else if (realFcr >= 1.70) {
        statusReal = 'critical'; // Pemborosan kritis
      } else if (realFcr > 1.55) {
        statusReal = 'warning'; // Pemborosan ringan
      }

      const deficitFeedKg = Math.max(0, parseFloat((pakanIdeal - totalPakanTerpakai).toFixed(1)));
      const pakanHarianRekomendasi = parseFloat((pakanIdeal / (age || 1)).toFixed(1));

      return {
        fcr: realFcr,
        penalty: totalPenalty,
        actualWeight,
        wastedFeed: wastedFeedReal,
        wastedCost: wastedCostReal,
        status: statusReal,
        mode: 'nyata',
        pakanHariIni,
        totalPakanTerpakai: parseFloat(totalPakanTerpakai.toFixed(1)),
        pakanIdealRekomendasi: parseFloat(pakanIdeal.toFixed(1)),
        pakanHarianRekomendasi,
        deficitFeedKg
      };
    }

    // ============================================
    // MODE ESTIMASI: Tidak ada input pakan
    // ============================================
    const weightKg = actualWeight / 1000;
    const wastedFeed = parseFloat((jumlahAyam * weightKg * totalPenalty).toFixed(2));
    const wastedCost = Math.round(wastedFeed * currentFeedPrice);
    const pakanIdealRekomendasi = parseFloat(((jumlahAyam * weightKg) * 1.45).toFixed(1));
    const pakanHarianRekomendasi = parseFloat((pakanIdealRekomendasi / (age || 1)).toFixed(1));

    let status = 'optimal';
    if (actualFcr >= 1.7) status = 'critical';
    else if (actualFcr > 1.55) status = 'warning';

    return {
      fcr: actualFcr,
      penalty: totalPenalty,
      actualWeight,
      wastedFeed,
      wastedCost,
      status,
      mode: 'estimasi',
      pakanIdealRekomendasi,
      pakanHarianRekomendasi,
      deficitFeedKg: 0
    };
  };

  const fcrData = analyzeFcr();

  // ============================================
  // PLOTTING DATA GRAFIK (Cobb 500 vs Aktual)
  // ============================================
  const generateChartData = () => {
    const data = [];
    const siklusTarget = parseInt(settings?.siklusPanen || 35);
    const limit = Math.max(siklusTarget, age + 3);

    const dayPoints = new Set([0, 5, 10, 15, 20, 25, 30, siklusTarget]);
    if (age > 0 && age <= limit) {
      dayPoints.add(age);
    }
    const sortedDays = Array.from(dayPoints).sort((a, b) => a - b);
    
    for (const d of sortedDays) {
      const targetW = getStandardWeight(d);
      const reduction = 1 - (fcrData.penalty * 0.4);
      const actualW = Math.round(targetW * (d <= age ? reduction : 1));

      data.push({
        day: d === age ? `Hari ${d} (Saat Ini)` : `Hari ${d}`,
        Target: targetW,
        Aktual: d <= age ? actualW : null
      });
    }
    return data;
  };

  const chartData = generateChartData();

  return (
    <div className="space-y-8 animate-fadeIn relative">

      {/* TOAST SUCCESS NOTIFICATION */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-teal-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-teal-500 animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          <span>Kalkulasi FCR Nyata Berhasil Diperbarui!</span>
        </div>
      )}

      {/* BANNER INPUT PAKAN MANUAL & HARGA PAKAN PER KG */}
      <div className={`p-5 rounded-[24px_10px_24px_10px] border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 transition-all duration-300 ${
        isManualMode 
          ? 'bg-teal-50/40 border-teal-300/40 shadow-sm' 
          : 'bg-amber-50/30 border-amber-200/40'
      }`}>
        <div className="flex items-start gap-3 flex-1">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
            isManualMode ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'
          }`}>
            {isManualMode ? <Pencil className="w-5 h-5" /> : <FlaskConical className="w-5 h-5" />}
          </div>
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-wider ${isManualMode ? 'text-teal-800' : 'text-amber-800'}`}>
              {isManualMode ? '✅ Mode Data Nyata — FCR Dihitung dari Input Pakan Anda' : '⚠️ Mode Rekomendasi Standar — FCR Dihitung dari Standar Cobb 500 & Sensor IoT'}
            </p>
            <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">
              {isManualMode 
                ? 'Ketik jumlah pakan total kandang (kg/hari), sesuaikan harga pakan (Rp/kg), lalu klik "Hitung FCR Nyata".'
                : 'Belum ada input pakan manual. Angka yang tampil saat ini adalah Jumlah Rekomendasi Standar Cobb 500 berbasis kondisi sensor IoT Anda.'}
            </p>
          </div>
        </div>

        {/* INPUT FORM (PAKANS & HARGA PER KG) */}
        <div className="flex flex-wrap items-center gap-3 shrink-0 w-full lg:w-auto">
          
          {/* INPUT HARGA PAKAN PER KG */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-amber-500/20">
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[10px] font-bold text-slate-400">Rp</span>
            <input
              type="number"
              step="100"
              min="1000"
              value={hargaPakan}
              onChange={(e) => setHargaPakan(e.target.value)}
              placeholder="12000"
              className="w-20 text-xs font-extrabold text-slate-800 focus:outline-none bg-transparent"
            />
            <span className="text-[10px] font-bold text-slate-500">/kg</span>
          </div>

          {isManualMode && (
            <form onSubmit={handleCalculateFcr} className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 bg-white border border-teal-300/60 rounded-xl px-3 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-teal-500/20">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={inputPakan}
                  onChange={(e) => setInputPakan(e.target.value)}
                  placeholder="Contoh: 34"
                  className="w-24 text-xs font-extrabold text-slate-800 focus:outline-none bg-transparent"
                />
                <span className="text-[10px] font-bold text-teal-700">kg/hari</span>
              </div>
              <button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700 active:scale-95 text-white px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>Hitung FCR Nyata</span>
              </button>
            </form>
          )}

          <button
            type="button"
            onClick={handleToggleMode}
            className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${
              isManualMode 
                ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'
                : 'bg-teal-600 text-white border-teal-600 hover:bg-teal-700 shadow-sm'
            }`}
          >
            {isManualMode ? 'Kembali ke Mode Rekomendasi' : '✏️ Input Data Pakan Nyata'}
          </button>
        </div>
      </div>

      {/* RINCIAN DETAIL RUMUS & KALKULASI FCR CARD */}
      <div className="glass-card p-5 rounded-[24px_10px_24px_10px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/20 shadow-[0_4px_16px_rgba(4,47,46,0.015)] space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-teal-600" />
            <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">
              Rincian Detail Rumus Kalkulasi FCR
            </h5>
            <button 
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-[10px] text-teal-700 hover:text-teal-900 font-bold bg-teal-50 hover:bg-teal-100 px-2 py-0.5 rounded-md border border-teal-200/60 transition-all flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Darimana angka ini?</span>
              {showExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
            fcrData.mode === 'nyata' 
              ? 'bg-teal-50 text-teal-700 border-teal-200/50' 
              : 'bg-amber-50 text-amber-700 border-amber-200/50'
          }`}>
            {fcrData.mode === 'nyata' ? '📊 Mode Nyata (Input Pakan Riil)' : '🔬 Mode Rekomendasi (Standar Cobb 500)'}
          </span>
        </div>

        {/* KOTAK PENJELASAN EDUKATIF TRANSPARAN */}
        {showExplanation && (
          <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-3.5 text-[10px] text-amber-950 space-y-1.5 leading-relaxed animate-fadeIn">
            <div className="flex items-center gap-1.5 font-black text-amber-900 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>💡 Perbedaan Mode Nyata vs Mode Rekomendasi Standar:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 font-medium text-amber-900/90 pl-1">
              <li>
                <strong>Mode Rekomendasi Standar</strong>: Digunakan jika Anda belum memasukkan pakan. Angka <strong className="text-amber-950">{fcrData.pakanIdealRekomendasi} kg (rata-rata ~{fcrData.pakanHarianRekomendasi} kg/hari)</strong> adalah <u>Jumlah Rekomendasi Teoritis</u> ideal ras Cobb 500 untuk {jumlahAyam} ekor ayam umur {age} hari.
              </li>
              <li>
                <strong>Mode Data Nyata</strong>: Aktif saat Anda mengetik pakan riil di kandang (misal 34 kg/hari) dan menekan tombol <span className="font-extrabold text-teal-800 bg-teal-100 px-1.5 py-0.5 rounded border border-teal-200">&quot;Hitung FCR Nyata&quot;</span>. Angka FCR dan Total Pakan otomatis mengikuti data riil Anda!
              </li>
              <li>
                <strong>Acuan Harga Pakan</strong>: Kerugian Rupiah dihitung dari <strong>Rp {currentFeedPrice.toLocaleString('id-ID')}/kg</strong> (dapat Anda ubah sendiri di kolom input harga di atas).
              </li>
            </ul>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* STEP 1 */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all ${
            fcrData.mode === 'nyata' ? 'bg-teal-50/30 border-teal-200/60' : 'bg-white border-slate-150/60'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider">
                  {fcrData.mode === 'nyata' ? '1. Total Pakan Riil' : '1. Total Pakan (Rekomendasi)'}
                </p>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                  fcrData.mode === 'nyata' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {fcrData.mode === 'nyata' ? '📊 Data Nyata' : '📋 Jumlah Rekomendasi'}
                </span>
              </div>
              <h5 className="text-base font-black text-slate-800 mt-1">
                {fcrData.mode === 'nyata' && fcrData.totalPakanTerpakai
                  ? `${fcrData.totalPakanTerpakai} kg (${fcrData.pakanHariIni} kg/hari)`
                  : `${fcrData.pakanIdealRekomendasi} kg (~${fcrData.pakanHarianRekomendasi} kg/hari)`}
              </h5>
            </div>
            <p className="text-[8.5px] text-slate-500 mt-2 font-medium border-t pt-1.5">
              {fcrData.mode === 'nyata' && fcrData.pakanHariIni
                ? `Input Riil: ${fcrData.pakanHariIni} kg/hari × ${age || 1} Hari`
                : `Rekomendasi Cobb 500: ~${fcrData.pakanHarianRekomendasi} kg/hari (${jumlahAyam} Ekor, Umur ${age || 1} Hari)`}
            </p>
          </div>

          {/* STEP 2 */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-150/60 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider">2. Biomassa Daging Kandang</p>
                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                  Umur {age} Hari
                </span>
              </div>
              <h5 className="text-base font-black text-slate-800 mt-1">
                {((fcrData.actualWeight * jumlahAyam) / 1000).toFixed(1)} kg
              </h5>
            </div>
            <p className="text-[8.5px] text-slate-500 mt-2 font-medium border-t pt-1.5">
              Standar Cobb 500: ({fcrData.actualWeight}g / 1000) × {jumlahAyam} Ekor
            </p>
          </div>

          {/* STEP 3 */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${
            fcrData.status === 'abnormal_low'
              ? 'bg-red-50/60 border-red-300/80'
              : fcrData.mode === 'nyata' 
              ? 'bg-teal-50/40 border-teal-300/80' 
              : 'bg-white border-slate-150/60'
          }`}>
            <div>
              <div className="flex items-center justify-between">
                <p className={`text-[9.5px] font-extrabold uppercase tracking-wider ${
                  fcrData.status === 'abnormal_low' ? 'text-red-700' : 'text-teal-700'
                }`}>
                  {fcrData.mode === 'nyata' ? '3. FCR Hasil Kalkulasi (Nyata)' : '3. FCR Proyeksi Estimasi'}
                </p>
                <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded ${
                  fcrData.status === 'abnormal_low'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-teal-100 text-teal-800'
                }`}>
                  {fcrData.status === 'abnormal_low' ? '🔴 Pakan Kurang' : fcrData.mode === 'nyata' ? 'FCR Riil' : 'FCR Proyeksi'}
                </span>
              </div>
              <h5 className={`text-base font-black mt-1 ${
                fcrData.status === 'abnormal_low' ? 'text-red-600' : 'text-teal-650'
              }`}>
                {fcrData.fcr}
              </h5>
            </div>
            <p className={`text-[8.5px] mt-2 font-medium border-t pt-1.5 ${
              fcrData.status === 'abnormal_low' ? 'text-red-600 border-red-200' : 'text-teal-600 border-teal-100'
            }`}>
              {fcrData.status === 'abnormal_low'
                ? '⚠️ Angka FCR < 1.25 tidak logis / pakan terlalu sedikit'
                : fcrData.mode === 'nyata' 
                ? `Rumus Riil: Total Pakan (${fcrData.totalPakanTerpakai}kg) ÷ Biomassa (${((fcrData.actualWeight * jumlahAyam)/1000).toFixed(1)}kg)`
                : `FCR Target (1.45) + Penalti Sensor IoT (+${fcrData.penalty.toFixed(2)})`}
            </p>
          </div>

          {/* STEP 4 */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-150/60 shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <p className="text-[9.5px] font-extrabold text-slate-500 uppercase tracking-wider">4. Target / Rekomendasi Standard</p>
                <span className="text-[8px] font-extrabold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                  Target 1.45
                </span>
              </div>
              <h5 className="text-base font-black text-slate-800 mt-1">
                1.45
              </h5>
            </div>
            <p className="text-[8.5px] text-slate-500 mt-2 font-medium border-t pt-1.5">
              Target Rasio Pakan Ideal Dunia (Broiler Cobb 500)
            </p>
          </div>
        </div>

        {/* PERBANDINGAN PAKAN RIIL VS REKOMENDASI HANYA PADA MODE NYATA */}
        {fcrData.mode === 'nyata' && (
          <div className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px] font-bold transition-all ${
            fcrData.status === 'abnormal_low'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-teal-50/50 border-teal-200/50 text-teal-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full animate-ping ${
                fcrData.status === 'abnormal_low' ? 'bg-red-500' : 'bg-teal-500'
              }`} />
              <span>📊 Evaluasi Pakan Nyata vs Rekomendasi Standar Cobb 500:</span>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <span>Pakan Riil Anda: <strong>{fcrData.totalPakanTerpakai} kg ({fcrData.pakanHariIni} kg/hari)</strong></span>
              <span className="text-slate-400">|</span>
              <span>Pakan Rekomendasi Ideal: <strong>{fcrData.pakanIdealRekomendasi} kg (~{fcrData.pakanHarianRekomendasi} kg/hari)</strong></span>
              
              {fcrData.status === 'abnormal_low' ? (
                <span className="text-red-700 font-black bg-red-100 border border-red-200 px-2.5 py-0.5 rounded flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-600" /> 🔴 Pakan Terlalu Sedikit (Kurang {fcrData.deficitFeedKg} kg)
                </span>
              ) : fcrData.wastedFeed > 0 ? (
                <span className="text-amber-700 font-extrabold bg-amber-100 px-2 py-0.5 rounded">⚠️ Pemborosan Pakan (+{fcrData.wastedFeed} kg)</span>
              ) : (
                <span className="text-emerald-700 font-extrabold bg-emerald-100 px-2 py-0.5 rounded">🟢 Sangat Efisien</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ATAS: GRID KARTU FINANSIAL & METRIK (FCR, Weight, Wasted/Defisit) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KARTU FCR AKTUAL VS TARGET */}
        <div className={`glass-card rounded-[32px_12px_32px_12px] border p-6 flex items-center gap-4 transition-all ${
          fcrData.status === 'abnormal_low'
            ? 'border-red-300 bg-gradient-to-br from-white to-red-50/30 shadow-red-500/5'
            : 'border-slate-100 bg-gradient-to-br from-white to-teal-50/15 border-teal-500/10 shadow-[0_12px_24px_rgba(4,47,46,0.018)]'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border ${
            fcrData.status === 'abnormal_low'
              ? 'bg-red-100 text-red-700 border-red-200 animate-pulse'
              : 'bg-teal-50 text-teal-600 border-teal-150/40'
          }`}>
            <Scale className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Feed Conversion Ratio (FCR)</p>
            <h4 className={`text-xl font-black mt-1 ${fcrData.status === 'abnormal_low' ? 'text-red-600' : 'text-slate-800'}`}>
              {fcrData.fcr} 
              <span className="text-xs font-bold text-slate-450 ml-1.5">(Target: 1.45)</span>
            </h4>
            <p className="text-[9px] font-bold mt-0.5 uppercase tracking-wide">
              {fcrData.status === 'abnormal_low'
                ? '🔴 Pakan Tidak Logis / Kelaparan'
                : fcrData.status === 'optimal' 
                ? '🟢 Sangat Efisien' 
                : fcrData.status === 'warning' 
                ? '🟡 Pemborosan Ringan' 
                : '🔴 Pemborosan Kritis'}
            </p>
            <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${
              fcrData.status === 'abnormal_low'
                ? 'bg-red-100 text-red-700'
                : fcrData.mode === 'nyata' 
                ? 'bg-teal-100 text-teal-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {fcrData.status === 'abnormal_low' ? '⚠️ Pakan Sangat Kurang' : fcrData.mode === 'nyata' ? '📊 Data Nyata' : '📋 Rekomendasi Standar'}
            </span>
          </div>
        </div>

        {/* KARTU BOBOT RATA-RATA / EKOR */}
        <div className={`glass-card rounded-[32px_12px_32px_12px] border p-6 flex items-center gap-4 transition-all ${
          fcrData.status === 'abnormal_low'
            ? 'border-red-200 bg-gradient-to-br from-white to-red-50/20'
            : 'border-slate-100 bg-gradient-to-br from-white to-teal-50/15 border-teal-500/10 shadow-[0_12px_24px_rgba(4,47,46,0.018)]'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border ${
            fcrData.status === 'abnormal_low'
              ? 'bg-red-100 text-red-600 border-red-200'
              : 'bg-amber-50 text-amber-600 border-amber-150/40'
          }`}>
            <Award className="w-5.5 h-5.5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Bobot Rata-rata / Ekor</p>
            <h4 className="text-xl font-black text-slate-800 mt-1">
              {fcrData.actualWeight} Gram
            </h4>
            <p className="text-[9px] text-slate-455 font-bold mt-0.5">
              Total Biomassa Standar: {((fcrData.actualWeight * jumlahAyam) / 1000).toFixed(1)} kg ({jumlahAyam} Ekor)
            </p>
            {fcrData.status === 'abnormal_low' ? (
              <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block bg-red-100 text-red-700 border border-red-200">
                🔴 Terancam Kerdil (Pakan Kurang {fcrData.deficitFeedKg} kg)
              </span>
            ) : (
              <span className="text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block bg-amber-100 text-amber-700">
                🔬 Standar Kurva Cobb 500
              </span>
            )}
          </div>
        </div>

        {/* KARTU PAKAN MUBAZIR VS DEFISIT PAKAN */}
        <div className={`glass-card rounded-[32px_12px_32px_12px] border p-6 flex items-center gap-4 transition-all ${
          fcrData.status === 'abnormal_low'
            ? 'border-red-300 bg-gradient-to-br from-white to-red-50/40 shadow-red-500/5'
            : 'border-slate-100 bg-gradient-to-br from-white to-teal-50/15 border-teal-500/10 shadow-[0_12px_24px_rgba(4,47,46,0.018)]'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold shadow-sm shrink-0 border ${
            fcrData.status === 'abnormal_low'
              ? 'bg-red-100 text-red-700 border-red-300 animate-pulse'
              : fcrData.wastedCost > 0 
              ? 'bg-red-50 text-red-650 border-red-150/45 animate-pulse' 
              : 'bg-emerald-50 text-emerald-600 border-emerald-150/45'
          }`}>
            {fcrData.status === 'abnormal_low' ? <AlertTriangle className="w-5.5 h-5.5" /> : <DollarSign className="w-5.5 h-5.5" />}
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {fcrData.status === 'abnormal_low' ? 'Defisit / Kekurangan Pakan' : 'Kerugian Pakan Mubazir'}
            </p>
            
            {fcrData.status === 'abnormal_low' ? (
              <h4 className="text-xl font-black mt-1 text-red-600">
                Kurang {fcrData.deficitFeedKg} kg
              </h4>
            ) : (
              <h4 className={`text-xl font-black mt-1 ${fcrData.wastedCost > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                Rp {fcrData.wastedCost.toLocaleString('id-ID')}
              </h4>
            )}

            <p className="text-[9px] text-slate-455 font-bold mt-0.5">
              {fcrData.status === 'abnormal_low' ? (
                <span className="text-red-600">Total Diberikan: {fcrData.totalPakanTerpakai} kg (Kebutuhan: {fcrData.pakanIdealRekomendasi} kg)</span>
              ) : (
                <>
                  Pakan Terbuang: {fcrData.wastedFeed} kg
                  {fcrData.mode === 'nyata' && fcrData.totalPakanTerpakai && (
                    <span className="ml-1 text-teal-600"> (Total diberikan: {fcrData.totalPakanTerpakai} kg)</span>
                  )}
                </>
              )}
            </p>
            
            <span className={`text-[8px] font-extrabold uppercase tracking-widest px-1.5 py-0.5 rounded mt-1 inline-block ${
              fcrData.status === 'abnormal_low'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : fcrData.mode === 'nyata' 
                ? 'bg-teal-100 text-teal-700' 
                : 'bg-amber-100 text-amber-700'
            }`}>
              {fcrData.status === 'abnormal_low' ? '🔴 Defisit Pakan Kritis' : `🏷️ Acuan Rp ${currentFeedPrice.toLocaleString('id-ID')}/kg`}
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
            🔬 Standar Cobb-Vantress Broiler Guide
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
              : ' Pertahankan kondisi nyaman untuk mencapai target bobot panen tepat waktu.'}
          </div>
        </div>

      </div>

    </div>
  );
}
