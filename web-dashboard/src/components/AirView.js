import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wind, ShieldAlert, AlertTriangle, AlertOctagon, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function AirView({ telemetry, history }) {
  
  const getGasStatusObj = (val) => {
    if (val === 0) return { label: 'Memuat...', status: 'safe', color: 'text-slate-400 bg-slate-50 border-slate-200', desc: 'Menunggu telemetri...' };
    if (val >= 1500) {
      return {
        label: 'Bahaya Toksik! 🚨',
        status: 'danger',
        color: 'text-red-700 bg-red-50 border-red-200',
        desc: 'Konsentrasi gas amonia sangat pekat. Kondisi ini dapat merusak selaput paru-paru ayam, memicu kebutaan (konjungtivitis), dan menyebabkan kematian massal lemas. Aktifkan kipas sirkulasi kandang dan periksa kekeringan sekam!'
      };
    } else if (val >= 800) {
      return {
        label: 'Waspada Iritasi ⚠️',
        status: 'warning',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        desc: 'Gas amonia mulai menyengat. Dapat memicu gejala cekaman awal, iritasi mata ringan, dan mengganggu nafsu makan ayam. Disarankan untuk membuang bagian sekam yang basah.'
      };
    } else {
      return {
        label: 'Sangat Bersih (Aman) ✅',
        status: 'safe',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        desc: 'Kadar gas sangat rendah. Udara kandang bersih, metabolisme penyerapan pakan ayam broiler bekerja optimal untuk pembentukan bobot daging.'
      };
    }
  };

  const currentGas = telemetry ? telemetry.gas : 0;
  const gasStatus = getGasStatusObj(currentGas);

  // Kalkulasi rasio paparan gas bahaya dari history
  const calculateExposure = () => {
    if (!history || history.length === 0) return { ratio: 0, hours: 0 };
    const total = history.length;
    const toxicCount = history.filter(item => item.gas >= 1500).length;
    
    const ratio = toxicCount / total;
    const hours = parseFloat((ratio * 24).toFixed(1));
    return {
      ratio: Math.round(ratio * 100),
      hours
    };
  };

  const exposure = calculateExposure();

  // Format data histori Gas untuk chart
  const chartData = history.map(item => {
    const time = new Date(item.timestamp);
    const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      gas: item.gas
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl text-xs shadow-xl">
          <p className="text-slate-450 mb-1 font-medium">{payload[0].payload.time}</p>
          <p className="font-extrabold text-teal-700">
            Amonia Gas: {payload[0].value} ppm
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ATAS: GAUGE INDIKATOR UTAMA & RINGKASAN PAPARAN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARD AMONIA REAL-TIME */}
        <div className="lg:col-span-1 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full -z-10 blur-xl"></div>
          
          <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-6">Konsentrasi Gas Amonia</h4>
          
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin-slow ${
              gasStatus.status === 'safe' ? 'border-teal-200' : gasStatus.status === 'warning' ? 'border-amber-200' : 'border-red-200'
            }`}></div>
            
            <div className="w-32 h-32 rounded-full bg-white shadow-inner flex flex-col items-center justify-center border border-slate-100">
              <span className={`text-3xl font-black ${
                gasStatus.status === 'safe' ? 'text-teal-650' : gasStatus.status === 'warning' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {currentGas || '---'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ppm (MQ2)</span>
            </div>
          </div>

          <span className={`text-xs font-extrabold px-4 py-1.5 rounded-full border shadow-sm ${gasStatus.color}`}>
            {gasStatus.label}
          </span>
        </div>

        {/* LOG PAPARAN & VERDIK UDARA */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
              <Wind className="w-5 h-5 text-teal-600" /> Analisis Toksisitas & Kesehatan Udara
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Gas amonia bersifat iritatif pada selaput lendir. Ayam broiler yang menghirup udara ber-amonia tinggi secara kronis akan mengalami gangguan daya tahan tubuh, meningkatkan angka kematian maket.
            </p>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/50 shadow-inner text-xs font-medium text-slate-700 leading-relaxed">
              <span className="font-bold text-slate-850">Analisis Paparan Hari Ini: </span>
              Ayam telah terpapar gas bahaya (&ge; 1500 ppm) selama <strong className="font-extrabold text-teal-900">{exposure.hours} Jam/Hari</strong> (atau sekitar <strong className="font-extrabold text-teal-900">{exposure.ratio}%</strong> dari total riwayat telemetri berjalan).
            </div>
          </div>

          {/* Standar Amonia */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold mt-6 pt-4 border-t border-slate-100">
            <div className="text-teal-700">
              <p>🟢 &lt; 800 ppm</p>
              <p className="font-medium text-slate-450 mt-0.5">Aman & Optimal</p>
            </div>
            <div className="text-amber-700">
              <p>🟡 800 - 1500</p>
              <p className="font-medium text-slate-450 mt-0.5">Iritasi Kornea Awal</p>
            </div>
            <div className="text-red-700">
              <p>🔴 &ge; 1500</p>
              <p className="font-medium text-slate-450 mt-0.5">Toksisitas Paru (Bahaya)</p>
            </div>
          </div>
        </div>

      </div>

      {/* GRAFIK HISTORI GAS AMONIA */}
      <div className="glass-card p-6 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)]">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-teal-650" /> Tren Konsentrasi Gas Amonia (Histori Telemetri)
        </h4>

        <div className="h-[280px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-300">
              Menunggu data masuk...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} dx={-5} domain={[400, 2000]} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="gas" 
                  stroke="#0d9488" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorGas)" 
                  dot={{ stroke: '#0d9488', strokeWidth: 1.5, r: 3, fill: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* REKOMENDASI PENGELOLAAN ALAS SEKAM (LITTER MANAGEMENT) */}
      <div className="glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)]">
        <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
          <HelpCircle className="w-5 h-5 text-teal-650" /> Panduan Pengelolaan Alas Sekam (Litter Management)
        </h4>
        
        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Kadar gas amonia dipicu langsung oleh tingkat kebasahan alas sekam akibat kotoran yang menumpuk. Berikut langkah taktis peternak pintar berdasarkan kondisi sensor:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
          <div className="p-5 rounded-2xl bg-teal-50/20 border border-teal-150/40 space-y-2">
            <h5 className="font-extrabold text-teal-900">✔ Jika Gas Terdeteksi &ge; 1500 ppm:</h5>
            <p className="leading-relaxed font-medium">
              1. <strong className="font-bold text-teal-900">Ganti Sekam Basah</strong>: Segera serok bagian sekam yang menggumpal/basah dan ganti dengan sekam padi baru yang kering.
              <br />2. <strong className="font-bold text-teal-900">Tabur Kapur Dolomit</strong>: Taburkan kapur dolomit/zeolit tipis untuk mengikat nitrogen kotoran dan menekan pembentukan amonia.
              <br />3. <strong className="font-bold text-teal-900">Paksa ON Blower</strong>: Nyalakan Kipas exhaust pada dashboard mode &quot;Paksa ON&quot; untuk menyedot gas keluar maket kandang.
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/50 space-y-2">
            <h5 className="font-extrabold text-slate-800">✔ Pemeliharaan Rutin Kandang:</h5>
            <p className="leading-relaxed font-medium">
              1. <strong className="font-bold text-slate-850">Periksa Kebocoran Nipel</strong>: Cek air minum agar tidak menetes membasahi lantai alas.
              <br />2. <strong className="font-bold text-slate-850">Tebal Sekam</strong>: Pastikan ketebalan alas sekam berkisar antara 8-12 cm agar penyerapan kotoran lebih maksimal.
              <br />3. <strong className="font-bold text-slate-850">Ventilasi Silang</strong>: Jaga agar tirai sirkulasi maket tidak tertutup rapat di siang hari demi pertukaran udara bersih.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
