import React, { useState, useEffect } from 'react';
import { Fan, Thermometer, ShieldAlert, Cpu } from 'lucide-react';

export default function ControlPanel({ settings, onUpdateSettings, isLoading }) {
  const [suhu, setSuhu] = useState(32.0);
  const [gas, setGas] = useState(1500);
  const [mode, setMode] = useState(0);
  const [isTouched, setIsTouched] = useState(false);

  useEffect(() => {
    if (settings && !isTouched) {
      setSuhu(settings.suhuThreshold);
      setGas(settings.gasThreshold);
      setMode(settings.modeKipas);
    }
  }, [settings, isTouched]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsTouched(false);
    onUpdateSettings({
      suhuThreshold: parseFloat(suhu),
      gasThreshold: parseInt(gas),
      modeKipas: parseInt(mode)
    });
  };

  return (
    <div className="glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
        <div className="p-2.5 bg-teal-50 text-teal-600 rounded-2xl shadow-sm">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-extrabold text-slate-800 tracking-tight">Kontrol Sistem IoT</h4>
          <p className="text-[10px] text-slate-400 font-medium">Ubah threshold & mode exhaust blower</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Kipas */}
        <div>
          <label className="block text-[10px] uppercase font-extrabold tracking-widest text-slate-400 mb-3 flex items-center gap-2">
            <Fan className="w-4 h-4 text-teal-600" /> Mode Kerja Kipas
          </label>
          <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-100/80">
            {[
              { val: 0, label: 'Otomatis', desc: 'Sesuai Sensor' },
              { val: 1, label: 'Paksa ON', desc: 'Selalu Hidup' },
              { val: 2, label: 'Paksa OFF', desc: 'Selalu Mati' }
            ].map((opt) => (
              <button
                key={opt.val}
                type="button"
                onClick={() => {
                  setMode(opt.val);
                  setIsTouched(true);
                }}
                className={`py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                  mode === opt.val
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <div>{opt.label}</div>
                <div className="text-[9px] opacity-60 font-normal mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Slider Suhu Threshold */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-teal-600" /> Threshold Suhu
            </label>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100/50">
              {suhu}°C
            </span>
          </div>
          <input
            type="range"
            min="25"
            max="40"
            step="0.5"
            value={suhu}
            onChange={(e) => {
              setSuhu(e.target.value);
              setIsTouched(true);
            }}
            className="w-full accent-teal-600 bg-slate-100 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
            <span>25°C</span>
            <span>Optimal</span>
            <span>40°C (Panas)</span>
          </div>
        </div>

        {/* Input Gas Threshold */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[10px] uppercase font-extrabold tracking-widest text-slate-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" /> Threshold Gas Amonia
            </label>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100/50">
              {gas} ppm
            </span>
          </div>
          <input
            type="range"
            min="200"
            max="3000"
            step="100"
            value={gas}
            onChange={(e) => {
              setGas(e.target.value);
              setIsTouched(true);
            }}
            className="w-full accent-amber-500 bg-slate-100 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-medium">
            <span>200 ppm</span>
            <span>Waspada</span>
            <span>3000 ppm</span>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-teal-600/15 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
        >
          {isLoading ? 'Menyimpan...' : 'Terapkan Pengaturan'}
        </button>
      </form>
    </div>
  );
}
