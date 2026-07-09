import { initDb, updateSettings, getSettings } from '../../../lib/db';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// POST: Perbarui konfigurasi threshold suhu, threshold gas, mode kipas, atau data populasi kandang
export async function POST(request) {
  try {
    await ensureDb();
    
    const body = await request.json();
    const { 
      suhuThreshold, 
      gasThreshold, 
      modeKipas,
      jumlahAyam,
      tanggalMasuk,
      varietasAyam,
      siklusPanen
    } = body;

    // Lakukan update settings
    const updated = await updateSettings(
      suhuThreshold !== undefined ? parseFloat(suhuThreshold) : undefined,
      gasThreshold !== undefined ? parseInt(gasThreshold) : undefined,
      modeKipas !== undefined ? parseInt(modeKipas) : undefined,
      jumlahAyam !== undefined ? parseInt(jumlahAyam) : undefined,
      tanggalMasuk !== undefined ? tanggalMasuk : undefined,
      varietasAyam !== undefined ? varietasAyam : undefined,
      siklusPanen !== undefined ? parseInt(siklusPanen) : undefined
    );

    return new Response(JSON.stringify({
      status: "ok",
      settings: updated
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
    console.error("Error in POST /api/control:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// GET: Mendapatkan setting aktif saat ini (termasuk data populasi)
export async function GET() {
  try {
    await ensureDb();
    const settings = await getSettings();
    return new Response(JSON.stringify({ status: "ok", settings }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ status: "error", message: error.message }), { status: 500 });
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
