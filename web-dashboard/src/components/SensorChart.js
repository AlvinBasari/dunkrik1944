'use client';

import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Thermometer, Droplets, ShieldAlert } from 'lucide-react';

export default function SensorChart({ history }) {
  const [activeTab, setActiveTab] = useState('suhu');

  // Format data untuk grafik
  const chartData = history.map(item => {
    const time = new Date(item.timestamp);
    const timeStr = time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return {
      time: timeStr,
      suhu: item.suhu,
      kelembaban: item.kelembaban,
      gas: item.gas
    };
  });

  const getTabConfig = () => {
    switch (activeTab) {
      case 'kelembaban':
        return {
          key: 'kelembaban',
          label: 'Kelembaban',
          color: '#0d9488', // tosca/teal-600
          unit: '%',
          gradientId: 'colorLembab'
        };
      case 'gas':
        return {
          key: 'gas',
          label: 'Gas Amonia',
          color: '#d97706', // amber-600
          unit: ' ppm',
          gradientId: 'colorGas'
        };
      case 'suhu':
      default:
        return {
          key: 'suhu',
          label: 'Suhu',
          color: '#e11d48', // rose-600
          unit: '°C',
          gradientId: 'colorSuhu'
        };
    }
  };

  const config = getTabConfig();

  // ============================================
  // PENGHITUNG STATISTIK DESKRIPTIF LIVE
  // ============================================
  const getStats = () => {
    if (history.length === 0) return { min: 0, max: 0, avg: 0 };
    const vals = history.map(item => item[config.key]).filter(v => v !== undefined);
    if (vals.length === 0) return { min: 0, max: 0, avg: 0 };
    
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    
    return {
      min: min.toFixed(1),
      max: max.toFixed(1),
      avg: avg.toFixed(1)
    };
  };

  const stats = getStats();

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl text-xs shadow-xl">
          <p className="text-slate-400 mb-1 font-medium">{payload[0].payload.time}</p>
          <p className="font-bold text-slate-800" style={{ color: config.color }}>
            {config.label}: {payload[0].value}{config.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-card p-6 rounded-[28px_12px_28px_12px] border border-teal-500/10 bg-gradient-to-br from-white to-teal-50/15 shadow-[0_12px_24px_rgba(4,47,46,0.018)]">
      
      {/* HEADER SECTION WITH STATS AND SELECTOR */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
        
        {/* JUDUL & LIVE BADGE */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl shadow-inner shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-800 tracking-tight leading-none">Tren Data Sensor</h4>
              <span className="flex items-center gap-1 text-[7.5px] font-black text-emerald-600 bg-emerald-50 border border-emerald-150/40 px-1.5 py-0.5 rounded-md tracking-wider uppercase animate-pulse shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                LIVE RECORD
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Histori perkembangan parameter kandang</p>
          </div>
        </div>

        {/* BARIS DATA STATISTIK DESKRIPTIF DINAMIS */}
        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 px-4 py-2 bg-white/70 border border-slate-150/40 rounded-2xl text-[9px] font-black text-slate-500 shadow-inner self-stretch xl:self-auto justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              MIN: <span className="text-slate-800 font-extrabold">{stats.min}{config.unit}</span>
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              MAX: <span className="text-slate-800 font-extrabold">{stats.max}{config.unit}</span>
            </span>
            <span className="text-slate-200">|</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              RERATA: <span className="text-slate-800 font-extrabold">{stats.avg}{config.unit}</span>
            </span>
          </div>
        )}

        {/* TAB SELECTOR */}
        <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 self-stretch xl:self-auto shrink-0">
          {[
            { id: 'suhu', label: 'Suhu', icon: Thermometer },
            { id: 'kelembaban', label: 'Lembab', icon: Droplets },
            { id: 'gas', label: 'Gas', icon: ShieldAlert }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 xl:flex-initial flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* RECHARTS AREA CHART */}
      <div className="h-[280px] w-full">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-xs text-slate-300">
            Belum ada data telemetri masuk...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={config.gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={config.color} stopOpacity={0.15}/>
                  <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis 
                dataKey="time" 
                stroke="#94a3b8" 
                fontSize={10}
                dy={10}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={10}
                dx={-5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey={config.key} 
                stroke={config.color} 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill={`url(#${config.gradientId})`} 
                dot={{ stroke: config.color, strokeWidth: 1.5, r: 3, fill: '#ffffff' }}
                activeDot={{ r: 5, strokeWidth: 1.5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
