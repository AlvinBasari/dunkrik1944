import { initDb, addTelemetry, getTelemetryHistory, getSettings } from '../../../lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// GET: Ambil histori data telemetry untuk chart & status setting saat ini
export async function GET(request) {
  try {
    await ensureDb();
    
    // Ambil parameter limit jika ada (default 20)
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const settings = await getSettings();
    const history = await getTelemetryHistory(limit);

    return new Response(JSON.stringify({
      status: "ok",
      settings,
      history
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error("Error in GET /api/telemetry:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Terima data dari ESP32 atau Simulator IoT
export async function POST(request) {
  try {
    await ensureDb();
    
    const body = await request.json();
    const { suhu, kelembaban, gas, gasTerdeteksi, gerakan } = body;

    // Validasi input
    if (suhu === undefined || kelembaban === undefined || gas === undefined) {
      return new Response(JSON.stringify({ status: "error", message: "Missing required fields" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ambil setting aktif
    const settings = await getSettings();
    const { suhuThreshold, gasThreshold, modeKipas } = settings;

    // Evaluasi aturan kontrol otomatis (seperti di main.cpp)
    const suhuTinggi = suhu >= suhuThreshold;
    const gasTinggi = gas >= gasThreshold;

    let kipas = false;
    if (modeKipas === 0) {
      // Auto
      kipas = suhuTinggi || gasTinggi;
    } else if (modeKipas === 1) {
      // Manual ON
      kipas = true;
    } else {
      // Manual OFF
      kipas = false;
    }

    const led = gasTinggi;
    const buzzer = gasTinggi;

    // Simpan ke database
    const telemetryData = {
      suhu,
      kelembaban,
      gas,
      gasTerdeteksi: !!gasTerdeteksi || gasTinggi,
      gerakan: !!gerakan,
      kipas,
      led,
      buzzer
    };

    const savedRecord = await addTelemetry(telemetryData);

    // Respon instruksi untuk ESP32/Simulator
    return new Response(JSON.stringify({
      status: "ok",
      timestamp: savedRecord?.timestamp || new Date().toISOString(),
      control: {
        modeKipas,
        suhuThreshold,
        gasThreshold,
        kipas,
        led,
        buzzer
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error("Error in POST /api/telemetry:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// OPTIONS handler untuk CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
