import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Heart, Activity, Flame, ShieldCheck, Thermometer } from 'lucide-react';

export default function HsiView({ telemetry, history }) {
  
  const calculateHsi = (suhu, kelembaban) => {
    const suhuF = suhu * 1.8 + 32;
    return parseFloat((suhuF + kelembaban).toFixed(1));
  };

  const getHsiStatusObj = (val) => {
    if (val === 0) return { label: 'Memuat...', status: 'safe', color: 'text-slate-400 bg-slate-55', desc: 'Menunggu telemetri...' };
    if (val >= 160.0) {
      return {
        label: 'Bahaya Heat Stroke! 🚨',
        status: 'danger',
        color: 'text-red-700 bg-red-50 border-red-200',
        desc: 'Ayam berada pada tingkat cekaman panas sangat berat. Berisiko tinggi mengalami kematian mendadak akibat kegagalan sirkulasi darah. Exhaust fan harus dinyalakan maksimal!'
      };
    } else if (val >= 155.0) {
      return {
        label: 'Cekaman Awal (Hangat) ⚠️',
        status: 'warning',
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        desc: 'Ayam mulai merasa kegerahan. Bobot ayam dapat menurun karena pakan yang dikonsumsi berkurang. Disarankan mengaktifkan kipas angin sirkulasi kandang.'
      };
    } else {
      return {
        label: 'Sangat Nyaman (Optimal) ✅',
        status: 'safe',
        color: 'text-teal-700 bg-teal-50 border-teal-200',
        desc: 'Suhu dan kelembaban berada pada titik keselarasan yang sempurna. Tingkat metabolisme ayam bekerja optimal untuk memproduksi daging.'
      };
    }
  };

  const currentHsiVal = telemetry ? calculateHsi(telemetry.suhu, telemetry.kelembaban) : 0;
  const hsiStatus = getHsiStatusObj(currentHsiVal);

  // Format data histori HSI untuk chart
  const chartData = history.map(item => {
    const time = new Date(item.timestamp);
    const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    return {
      time: timeStr,
      hsi: calculateHsi(item.suhu, item.kelembaban)
    };
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl text-xs shadow-xl">
          <p className="text-slate-450 mb-1 font-medium">{payload[0].payload.time}</p>
          <p className="font-extrabold text-teal-700">
            HSI Index: {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ATAS: GAUGE INDIKATOR UTAMA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CARD GAUGE (1/3) */}
        <div className="lg:col-span-1 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] relative overflow-hidden flex flex-col items-center text-center">
          <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full -z-10 blur-xl"></div>
          
          <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-6">Indeks HSI Real-time</h4>
          
          {/* Bulatan Gauge Representasi Nilai HSI */}
          <div className="relative w-40 h-40 flex items-center justify-center mb-4">
            {/* Outer Ring */}
            <div className={`absolute inset-0 rounded-full border-4 border-dashed animate-spin-slow ${
              hsiStatus.status === 'safe' ? 'border-teal-200' : hsiStatus.status === 'warning' ? 'border-amber-200' : 'border-red-200'
            }`}></div>
            
            {/* Inner Ring */}
            <div className="w-32 h-32 rounded-full bg-white shadow-inner flex flex-col items-center justify-center border border-slate-100">
              <span className={`text-4xl font-black ${
                hsiStatus.status === 'safe' ? 'text-teal-600' : hsiStatus.status === 'warning' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {currentHsiVal || '---'}
              </span>
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Poultry HSI</span>
            </div>
          </div>

          <span className={`text-xs font-extrabold px-4 py-1.5 rounded-full border shadow-sm ${hsiStatus.color}`}>
            {hsiStatus.label}
          </span>
        </div>

        {/* PENJELASAN ILMIAH (2/3) */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-teal-600" /> Analisis Kenyamanan Biologis Ayam
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Ayam broiler memiliki bulu yang lebat dan tidak bisa berkeringat. Satu-satunya cara mereka membuang panas tubuh adalah melalui paru-paru dengan membuang uap air (*evaporative cooling*).
            </p>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/50 shadow-inner text-xs font-medium text-slate-700 leading-relaxed">
              <span className="font-extrabold text-slate-800">Status Saat Ini: </span>
              {hsiStatus.desc}
            </div>
          </div>

          {/* Standar HSI */}
          <div className="grid grid-cols-3 gap-2 text-[10px] font-bold mt-6 pt-4 border-t border-slate-100">
            <div className="text-teal-700">
              <p>🟢 &lt; 155</p>
              <p className="font-medium text-slate-450 mt-0.5">Sangat Nyaman</p>
            </div>
            <div className="text-amber-700">
              <p>🟡 155 - 160</p>
              <p className="font-medium text-slate-450 mt-0.5">Stres Ringan (Hangat)</p>
            </div>
            <div className="text-red-700">
              <p>🔴 &ge; 160</p>
              <p className="font-medium text-slate-450 mt-0.5">Bahaya Heat Stroke</p>
            </div>
          </div>
        </div>

      </div>

      {/* GRAFIK TREN HSI */}
      <div className="glass-card p-6 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)]">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Activity className="w-4 h-4 text-teal-600" /> Tren Indeks HSI (Histori Telemetri)
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
                  <linearGradient id="colorHsi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="time" stroke="#94a3b8" fontSize={10} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={10} dx={-5} domain={[130, 180]} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="hsi" 
                  stroke="#0d9488" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorHsi)" 
                  dot={{ stroke: '#0d9488', strokeWidth: 1.5, r: 3, fill: '#ffffff' }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

    </div>
  );
}
