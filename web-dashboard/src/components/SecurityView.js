import React from 'react';
import { 
  ShieldAlert, 
  Clock, 
  Bell, 
  Volume2, 
  HelpCircle, 
  AlertOctagon,
  CheckCircle2
} from 'lucide-react';

export default function SecurityView({ telemetry, settings, history, isSavingSettings, onUpdateSettings }) {
  
  // Deteksi mode siaga malam hari (19:00 - 05:00)
  const checkIsNightModeActive = () => {
    if (!telemetry) return false;
    const dateObj = new Date(telemetry.timestamp);
    const hour = dateObj.getHours();
    return hour >= 19 || hour < 5;
  };

  const isNightActive = checkIsNightModeActive();
  const currentHour = telemetry ? new Date(telemetry.timestamp).getHours() : 0;

  // Filter log deteksi gerakan di malam hari dari history
  const getNightMovementLogs = () => {
    return history.filter(item => {
      const dateObj = new Date(item.timestamp);
      const hour = dateObj.getHours();
      const isNight = hour >= 19 || hour < 5;
      return isNight && item.gerakan;
    }).reverse(); // Urutan terbaru di atas
  };

  const alertLogs = getNightMovementLogs();

  const currentBuzzerMode = settings?.modeBuzzer || 0;

  const handleToggleBuzzer = async () => {
    if (!onUpdateSettings) return;
    // Toggle antara Mode 1 (Manual ON / Sirine Pengusir) dan Mode 0 (Auto)
    const nextMode = currentBuzzerMode === 1 ? 0 : 1;
    await onUpdateSettings({ modeBuzzer: nextMode });
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* ATAS: STATUS SIAGA MALAM & TEST OVERRIDE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* PANEL STATUS SIAGA MALAM */}
        <div className="lg:col-span-1 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 w-24 h-24 bg-teal-500/5 rounded-full -z-10 blur-xl"></div>
          
          <div>
            <h4 className="text-xs font-black text-slate-450 uppercase tracking-widest mb-6">Siaga Malam</h4>
            
            <div className="flex items-center gap-4 mb-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm ${
                isNightActive 
                  ? 'bg-teal-50 text-teal-600 border border-teal-200/50' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200/50'
              }`}>
                <Clock className={`w-6 h-6 ${isNightActive ? 'animate-pulse' : ''}`} />
              </div>
              <div>
                <h5 className="font-extrabold text-slate-800 tracking-tight">
                  {isNightActive ? 'Sistem Siaga Aktif' : 'Sistem Siaga Nonaktif'}
                </h5>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Jam Kandang: {currentHour.toString().padStart(2, '0')}:00
                </p>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed mt-2">
              Sistem akan otomatis masuk ke mode <strong className="font-bold text-teal-800">Keamanan Siaga Malam</strong> mulai pukul <strong className="font-bold text-teal-800">19:00 s/d 05:00</strong>. Setiap gerakan terdeteksi di waktu ini dianggap ancaman bahaya predator.
            </p>
          </div>

          <div className={`mt-6 p-3 rounded-xl border text-[10px] font-bold text-center ${
            isNightActive 
              ? 'bg-teal-50 border-teal-100/50 text-teal-700' 
              : 'bg-slate-100 border-slate-200/20 text-slate-500'
          }`}>
            {isNightActive ? '🛡️ PEMANTAUAN PREDATOR AKTIF' : '💤 PETERNAKAN WAKTU SIANG'}
          </div>
        </div>

        {/* CONTROLLER TEST ALARM (BUZZER) */}
        <div className="lg:col-span-2 glass-card p-6 md:p-8 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)] flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-teal-600" /> Kendali Sirine Alarm Keamanan
            </h4>
            <p className="text-xs text-slate-650 leading-relaxed mb-4">
              Sirine/Buzzer dipasang langsung di kandang fisik ESP32 untuk menakut-nakuti predator (seperti ular, kucing liar, musang, tikus) dan memicu alarm ke pemilik kandang secara langsung.
            </p>
            
            <div className={`p-4 rounded-2xl border flex items-start gap-3 transition-all ${
              currentBuzzerMode === 1
                ? 'bg-red-50 border-red-200 text-red-900 animate-pulse'
                : 'bg-amber-50/60 border-amber-100/60 text-amber-900'
            }`}>
              <Volume2 className={`w-5 h-5 mt-0.5 shrink-0 ${currentBuzzerMode === 1 ? 'text-red-600' : 'text-amber-600'}`} />
              <div className="text-[11px] leading-relaxed">
                <span className="font-extrabold">
                  {currentBuzzerMode === 1 
                    ? '🔊 SIRINE MANUAL SEDANG AKTIF BERBUNYI DI KANDANG! ' 
                    : 'Uji Coba Sirine Kandang: '}
                </span>
                {currentBuzzerMode === 1 
                  ? 'Perangkat ESP32 sedang membunyikan buzzer pengusir predator. Klik tombol di bawah untuk mematikan.'
                  : 'Tombol di bawah digunakan untuk memicu sirine manual pada ESP32 untuk simulasi darurat atau pengusiran predator dari jarak jauh.'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggleBuzzer}
            disabled={isSavingSettings}
            className={`w-full py-3 rounded-xl font-extrabold transition-all mt-6 shadow-md flex items-center justify-center gap-2 text-xs active:scale-[0.98] ${
              currentBuzzerMode === 1
                ? 'bg-red-600 hover:bg-red-700 text-white border border-red-500 shadow-red-600/20'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Volume2 className={`w-4 h-4 ${currentBuzzerMode === 1 ? 'animate-bounce' : ''}`} />
            <span>
              {isSavingSettings 
                ? 'Mengirim Perintah ke ESP32...' 
                : currentBuzzerMode === 1 
                ? '⏹️ HENTIKAN SIRINE MANUAL (Kembali ke Mode Auto)' 
                : '🚨 BUNYIKAN SIRINE MANUAL (Pengusir Predator)'}
            </span>
          </button>
        </div>

      </div>

      {/* BAWAH: LOG DETEKSI GERAKAN MALAM HARI */}
      <div className="glass-card p-6 rounded-[32px_12px_32px_12px] border-slate-100 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_12px_24px_rgba(0,0,0,0.012)]">
        <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <ShieldAlert className="w-4.5 h-4.5 text-red-500" /> Log Percobaan Gerakan Malam (Siaga Bahaya)
        </h4>

        {alertLogs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-150/40 flex items-center justify-center text-teal-500 mb-3 shadow-inner">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs font-extrabold text-slate-700">Peternakan Aman 100%</p>
            <p className="text-[10px] text-slate-400 mt-1 font-semibold">Tidak terdeteksi adanya gerakan mencurigakan selama jam malam.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-bold">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-widest">
                  <th className="py-3 px-4 font-bold">Waktu Deteksi</th>
                  <th className="py-3 px-4 font-bold">Sensor Pemicu</th>
                  <th className="py-3 px-4 font-bold">Status Respons IoT</th>
                  <th className="py-3 px-4 font-bold text-right">Tingkat Ancaman</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50">
                {alertLogs.map((log, index) => {
                  const tglStr = new Date(log.timestamp).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  });
                  return (
                    <tr key={index} className="hover:bg-slate-50/30 transition-colors">
                      <td className="py-3 px-4 text-slate-700 font-semibold">{tglStr} WIB</td>
                      <td className="py-3 px-4 text-slate-550 font-medium">PIR Sensor (Pin 27)</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200/30 text-[9px] font-bold">
                          Buzzer ON & Alert Banner
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm">
                          🚨 TINGGI
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
