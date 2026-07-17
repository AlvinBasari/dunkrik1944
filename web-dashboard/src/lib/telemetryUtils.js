export function formatDuration(ms) {
  if (!ms || ms <= 0) return '0 Detik';
  const totalSec = Math.round(ms / 1000);
  if (totalSec < 60) return `${totalSec} Detik`;
  const min = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;
  if (min < 60) {
    return remSec > 0 ? `${min} Menit ${remSec} Detik` : `${min} Menit`;
  }
  const hrs = Math.floor(min / 60);
  const remMin = min % 60;
  return remMin > 0 ? `${hrs} Jam ${remMin} Menit` : `${hrs} Jam`;
}

export function calculateIotActiveStats(history = []) {
  if (!history || history.length === 0) {
    return {
      totalIotActiveMs: 0,
      totalKipasActiveMs: 0,
      totalGasToxicMs: 0,
      totalMonitoredMs: 0,
      uptimeRatio: 0,
      kipasDutyRatio: 0,
      iotActiveHours: 0,
      kipasActiveHoursDaily: 0,
      gasToxicHoursDaily: 0,
      gasToxicSeconds: 0,
      gasToxicFormatted: '0 Detik'
    };
  }

  // Pastikan history terurut berdasarkan timestamp ascending
  const sortedHistory = [...history].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  let totalIotActiveMs = 0;
  let totalKipasActiveMs = 0;
  let totalGasToxicMs = 0;

  const MAX_INTERVAL_MS = 60 * 1000; // Maksimal 60 detik antar-packet untuk dihitung online
  const DEFAULT_PACKET_MS = 15 * 1000; // Default fallback durasi 1 record jika single/isolated

  if (sortedHistory.length === 1) {
    totalIotActiveMs = DEFAULT_PACKET_MS;
    if (sortedHistory[0].kipas) totalKipasActiveMs = DEFAULT_PACKET_MS;
    if (sortedHistory[0].gas >= 1500) totalGasToxicMs = DEFAULT_PACKET_MS;
  } else {
    for (let i = 1; i < sortedHistory.length; i++) {
      const prev = sortedHistory[i - 1];
      const curr = sortedHistory[i];
      const prevTime = new Date(prev.timestamp).getTime();
      const currTime = new Date(curr.timestamp).getTime();
      const diffMs = currTime - prevTime;

      // Jika selisih waktu antar-packet valid (<= 60 detik)
      if (diffMs > 0 && diffMs <= MAX_INTERVAL_MS) {
        totalIotActiveMs += diffMs;
        if (prev.kipas) {
          totalKipasActiveMs += diffMs;
        }
        if (prev.gas >= 1500) {
          totalGasToxicMs += diffMs;
        }
      } else {
        // Jika terputus/offline (>60s), beri kredit minimal untuk packet individual yang masuk
        totalIotActiveMs += DEFAULT_PACKET_MS;
        if (curr.kipas) totalKipasActiveMs += DEFAULT_PACKET_MS;
        if (curr.gas >= 1500) totalGasToxicMs += DEFAULT_PACKET_MS;
      }
    }
  }

  const startTime = new Date(sortedHistory[0].timestamp).getTime();
  const endTime = new Date(sortedHistory[sortedHistory.length - 1].timestamp).getTime();
  const totalMonitoredMs = Math.max(endTime - startTime, totalIotActiveMs);

  const uptimeRatio = totalMonitoredMs > 0 ? Math.min(1, totalIotActiveMs / totalMonitoredMs) : 0;
  const kipasDutyRatio = totalIotActiveMs > 0 ? Math.min(1, totalKipasActiveMs / totalIotActiveMs) : 0;

  const iotActiveHours = parseFloat((totalIotActiveMs / (1000 * 60 * 60)).toFixed(2));
  const kipasActiveHoursDaily = parseFloat((kipasDutyRatio * 24).toFixed(1));
  const gasToxicHoursDaily = parseFloat(((totalGasToxicMs / (totalIotActiveMs || 1)) * 24).toFixed(1));

  return {
    totalIotActiveMs,
    totalKipasActiveMs,
    totalGasToxicMs,
    totalMonitoredMs,
    uptimeRatio: Math.round(uptimeRatio * 100),
    kipasDutyRatio,
    iotActiveHours,
    kipasActiveHoursDaily,
    gasToxicHoursDaily,
    gasToxicSeconds: Math.round(totalGasToxicMs / 1000),
    gasToxicFormatted: formatDuration(totalGasToxicMs)
  };
}
