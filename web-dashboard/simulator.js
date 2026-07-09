/**
 * SIMULATOR IOT ESP32 - SMART CHICKEN COOP
 * Script ini mensimulasikan modul ESP32 yang mengirim telemetry data ke Next.js Backend.
 * Jalankan ini di terminal terpisah: `node simulator.js`
 */

const BACKEND_URL = 'http://localhost:3001/api/telemetry';

// State simulasi
let simSuhu = 30.5;
let simKelembaban = 72.0;
let simGas = 120; // 100-200 = aman, >1500 = bahaya
let simGerakan = false;

// State aktuator yang dibaca dari respon server
let statusKipas = false;
let statusLed = false;
let statusBuzzer = false;

console.log("=== 🐔 SIMULATOR IoT SMART CHICKEN COOP STARTING ===");
console.log(`Mengirim telemetri ke: ${BACKEND_URL}`);
console.log("Tekan Ctrl+C untuk menghentikan.\n");

// Fungsi update simulasi fisik
function updateSimulatedPhysics() {
  // 1. Simulasi gerakan ayam acak (30% kemungkinan ada gerakan)
  simGerakan = Math.random() < 0.3;

  // 2. Simulasi dampak Kipas (Exhaust Fan) terhadap Suhu
  if (statusKipas) {
    // Jika kipas menyala, suhu turun perlahan
    simSuhu -= 0.15 + (Math.random() * 0.1);
    if (simSuhu < 27.5) simSuhu = 27.5; // suhu minimum pendinginan
    
    // Kelembaban turun perlahan
    simKelembaban -= 0.1;
    if (simKelembaban < 55.0) simKelembaban = 55.0;

    // Gas amonia tersedot keluar, berkurang drastis
    simGas -= 150 + Math.floor(Math.random() * 50);
    if (simGas < 100) simGas = 100;
  } else {
    // Jika kipas mati, panas dari tubuh ayam menumpuk
    simSuhu += 0.05 + (Math.random() * 0.05);
    if (simSuhu > 36.0) simSuhu = 36.0; // suhu maksimal kandang pengap

    // Kelembaban naik karena nafas ayam
    simKelembaban += 0.15;
    if (simKelembaban > 85.0) simKelembaban = 85.0;

    // Amonia menumpuk perlahan dari kotoran ayam
    simGas += 30 + Math.floor(Math.random() * 20);
  }

  // 3. Tambahkan sedikit noise acak pada sensor
  simSuhu += (Math.random() - 0.5) * 0.1;
  simKelembaban += (Math.random() - 0.5) * 0.2;

  // Pembulatan desimal
  simSuhu = parseFloat(simSuhu.toFixed(2));
  simKelembaban = parseFloat(simKelembaban.toFixed(2));
}

// Siklus pengiriman data
async function sendTelemetryCycle() {
  updateSimulatedPhysics();

  const payload = {
    suhu: simSuhu,
    kelembaban: simKelembaban,
    gas: simGas,
    gasTerdeteksi: simGas >= 1500, // Menirukan modul MQ2 DO
    gerakan: simGerakan
  };

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    if (data.status === 'ok') {
      const ctrl = data.control;
      
      // Update state aktuator lokal dari perintah backend
      statusKipas = ctrl.kipas;
      statusLed = ctrl.led;
      statusBuzzer = ctrl.buzzer;

      console.log(`[${new Date().toLocaleTimeString()}] 📡 Telemetri Terkirim:`);
      console.log(`   🌡️ Suhu : ${simSuhu}°C (Threshold: ${ctrl.suhuThreshold}°C)`);
      console.log(`   💧 Lembab: ${simKelembaban}%`);
      console.log(`   💨 Gas   : ${simGas} ppm (Status: ${simGas >= ctrl.gasThreshold ? '⚠️ BAHAYA' : '✅ AMAN'})`);
      console.log(`   🚶 Gerak : ${simGerakan ? 'Ada Gerakan 🐔' : 'Sunyi 💤'}`);
      console.log(`   🔧 Perintah Aktuator -> Kipas: ${statusKipas ? 'ON' : 'OFF'} [Mode: ${ctrl.modeKipas === 0 ? 'AUTO' : ctrl.modeKipas === 1 ? 'MANUAL-ON' : 'MANUAL-OFF'}] | LED: ${statusLed ? 'ON' : 'OFF'} | Buzzer: ${statusBuzzer ? 'ON' : 'OFF'}`);
      console.log("   -------------------------------------------------");
    } else {
      console.log(`[ERROR] Gagal memproses data: ${data.message}`);
    }
  } catch (error) {
    console.error(`[KONEKSI ERROR] Gagal mengirim data ke server. Pastikan Next.js menyala (npm run dev). Detail: ${error.message}`);
  }
}

// Kirim data setiap 5 detik
setInterval(sendTelemetryCycle, 5000);

// Jalankan pengiriman pertama segera
sendTelemetryCycle();
