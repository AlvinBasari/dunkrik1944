import { Pool } from 'pg';
import crypto from 'crypto';

let pool = null;

// Cek apakah DATABASE_URL tersedia
const isPgAvailable = !!process.env.DATABASE_URL;
let useMockFallback = !isPgAvailable;

if (isPgAvailable) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false },
    connectionTimeoutMillis: 3000
  });
} else {
  console.log("⚠️ DATABASE_URL tidak ditemukan. Menjalankan aplikasi dengan In-Memory Mock Database.");
}

// Helper Enkripsi SHA256 bawaan Node
export function hashPassword(password) {
  const secret = process.env.JWT_SECRET || 'super-secret-key-123-mercusuar';
  return crypto.createHmac('sha256', secret).update(password).digest('hex');
}

// ============================================
// MOCK DATABASE STATE (FALLBACK LOKAL)
// ============================================
let mockSettings = {
  suhuThreshold: 32.0,
  gasThreshold: 1500,
  modeKipas: 0, // 0 = Auto, 1 = Force ON, 2 = Force OFF
  modeBuzzer: 0, // 0 = Auto, 1 = Force ON (Sirine Manual), 2 = Force OFF
  jumlahAyam: 1250,
  tanggalMasuk: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 18 hari lalu
  varietasAyam: 'Broiler',
  siklusPanen: 35,
  hargaPakan: 12000
};

const defaultAdminPasswordHash = hashPassword('password123');
let mockUsers = [
  {
    id: 1,
    email: 'admin@mercusuar.com',
    password: defaultAdminPasswordHash,
    role: 'owner'
  }
];

let mockHistory = [];
const now = new Date();
for (let i = 11; i >= 0; i--) {
  const time = new Date(now.getTime() - i * 15 * 60 * 1000);
  const baseSuhu = 30 + Math.sin(i / 2) * 2;
  const baseGas = 100 + Math.floor(Math.random() * 50);
  mockHistory.push({
    id: 12 - i,
    suhu: parseFloat(baseSuhu.toFixed(1)),
    kelembaban: parseFloat((65 + Math.cos(i / 2) * 10).toFixed(1)),
    gas: baseGas,
    gasTerdeteksi: false,
    gerakan: Math.random() > 0.7,
    kipas: baseSuhu >= 32.0,
    led: false,
    buzzer: false,
    timestamp: time.toISOString()
  });
}

let mockIdCounter = mockHistory.length + 1;

// ============================================
// DATABASE METHODS (SELF-HEALING / RESILIENT)
// ============================================

// Inisialisasi Tabel di PostgreSQL
export async function initDb() {
  if (useMockFallback) return true;

  try {
    const client = await pool.connect();
    try {
      // 1. Buat tabel users
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(100) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'owner'
        );
      `);

      const userCheck = await client.query('SELECT COUNT(*) FROM users WHERE email = $1', ['admin@mercusuar.com']);
      if (parseInt(userCheck.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO users (email, password, role) 
          VALUES ($1, $2, $3);
        `, ['admin@mercusuar.com', defaultAdminPasswordHash, 'owner']);
        console.log("👤 Seeding admin user default berhasil!");
      }

      // 2. Buat tabel settings dengan kolom populasi baru
      await client.query(`
        CREATE TABLE IF NOT EXISTS coop_settings (
          id SERIAL PRIMARY KEY,
          suhu_threshold FLOAT NOT NULL DEFAULT 32.0,
          gas_threshold INT NOT NULL DEFAULT 1500,
          mode_kipas INT NOT NULL DEFAULT 0,
          jumlah_ayam INT NOT NULL DEFAULT 1250,
          tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE - INTERVAL '18 days',
          varietas_ayam VARCHAR(50) NOT NULL DEFAULT 'Broiler',
          siklus_panen INT NOT NULL DEFAULT 35
        );
      `);

      // Upgrade tabel jika kolom baru populasi belum ada
      await client.query(`ALTER TABLE coop_settings ADD COLUMN IF NOT EXISTS jumlah_ayam INT NOT NULL DEFAULT 1250;`);
      await client.query(`ALTER TABLE coop_settings ADD COLUMN IF NOT EXISTS tanggal_masuk DATE NOT NULL DEFAULT CURRENT_DATE - INTERVAL '18 days';`);
      await client.query(`ALTER TABLE coop_settings ADD COLUMN IF NOT EXISTS varietas_ayam VARCHAR(50) NOT NULL DEFAULT 'Broiler';`);
      await client.query(`ALTER TABLE coop_settings ADD COLUMN IF NOT EXISTS siklus_panen INT NOT NULL DEFAULT 35;`);
      await client.query(`ALTER TABLE coop_settings ADD COLUMN IF NOT EXISTS harga_pakan INT NOT NULL DEFAULT 12000;`);
      await client.query(`ALTER TABLE coop_settings ADD COLUMN IF NOT EXISTS mode_buzzer INT NOT NULL DEFAULT 0;`);

      const settingsCheck = await client.query('SELECT COUNT(*) FROM coop_settings');
      if (parseInt(settingsCheck.rows[0].count) === 0) {
        await client.query(`
          INSERT INTO coop_settings (suhu_threshold, gas_threshold, mode_kipas, jumlah_ayam, tanggal_masuk, varietas_ayam, siklus_panen) 
          VALUES (32.0, 1500, 0, 1250, CURRENT_DATE - INTERVAL '18 days', 'Broiler', 35);
        `);
      }

      // 3. Buat tabel telemetry
      await client.query(`
        CREATE TABLE IF NOT EXISTS telemetry_history (
          id SERIAL PRIMARY KEY,
          suhu FLOAT NOT NULL,
          kelembaban FLOAT NOT NULL,
          gas INT NOT NULL,
          gas_terdeteksi BOOLEAN NOT NULL DEFAULT FALSE,
          gerakan BOOLEAN NOT NULL DEFAULT FALSE,
          kipas BOOLEAN NOT NULL DEFAULT FALSE,
          led BOOLEAN NOT NULL DEFAULT FALSE,
          buzzer BOOLEAN NOT NULL DEFAULT FALSE,
          timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log("✅ Inisialisasi tabel PostgreSQL Lokal berhasil!");
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("❌ Gagal terhubung ke database PostgreSQL lokal. Mengaktifkan Mock Fallback. Detail error:", err.message);
    useMockFallback = true;
    return false;
  }
}

// User Helpers
export async function getUserByEmail(email) {
  if (useMockFallback) {
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    return user || null;
  }

  try {
    const res = await pool.query('SELECT id, email, password, role FROM users WHERE email = $1 LIMIT 1', [email]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return null;
  } catch (err) {
    console.error("❌ Gagal getUserByEmail:", err.message);
    return null;
  }
}

export async function createUser(email, plainPassword, role = 'owner') {
  const hash = hashPassword(plainPassword);
  
  if (useMockFallback) {
    const newUser = {
      id: mockUsers.length + 1,
      email,
      password: hash,
      role
    };
    mockUsers.push(newUser);
    return newUser;
  }

  try {
    const res = await pool.query(
      'INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role',
      [email, hash, role]
    );
    return res.rows[0];
  } catch (err) {
    console.error("❌ Gagal createUser:", err.message);
    return null;
  }
}

export async function getUsers() {
  if (useMockFallback) {
    return mockUsers.map(u => ({ id: u.id, email: u.email, role: u.role }));
  }

  try {
    const res = await pool.query('SELECT id, email, role FROM users ORDER BY id ASC');
    return res.rows;
  } catch (err) {
    console.error("❌ Gagal getUsers:", err.message);
    return [];
  }
}

export async function deleteUser(id) {
  if (useMockFallback) {
    const idx = mockUsers.findIndex(u => u.id === parseInt(id));
    if (idx !== -1) {
      const deleted = mockUsers[idx];
      mockUsers.splice(idx, 1);
      return deleted;
    }
    return null;
  }

  try {
    const res = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email, role', [id]);
    if (res.rows.length > 0) {
      return res.rows[0];
    }
    return null;
  } catch (err) {
    console.error("❌ Gagal deleteUser:", err.message);
    return null;
  }
}

// Settings Helpers
export async function getSettings() {
  if (useMockFallback) {
    return mockSettings;
  }

  try {
    const res = await pool.query(`
      SELECT suhu_threshold, gas_threshold, mode_kipas, 
             jumlah_ayam, tanggal_masuk, varietas_ayam, siklus_panen,
             COALESCE(harga_pakan, 12000) as harga_pakan,
             COALESCE(mode_buzzer, 0) as mode_buzzer
      FROM coop_settings LIMIT 1
    `);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      
      // Format objek tanggal masuk ke string YYYY-MM-DD
      let tanggalStr = mockSettings.tanggalMasuk;
      if (row.tanggal_masuk) {
        const d = new Date(row.tanggal_masuk);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        tanggalStr = `${yyyy}-${mm}-${dd}`;
      }

      return {
        suhuThreshold: row.suhu_threshold,
        gasThreshold: row.gas_threshold,
        modeKipas: row.mode_kipas,
        modeBuzzer: row.mode_buzzer || 0,
        jumlahAyam: row.jumlah_ayam,
        tanggalMasuk: tanggalStr,
        varietasAyam: row.varietas_ayam,
        siklusPanen: row.siklus_panen,
        hargaPakan: row.harga_pakan || 12000
      };
    }
    return mockSettings;
  } catch (err) {
    console.error("❌ Gagal getSettings:", err.message);
    return mockSettings;
  }
}

export async function updateSettings(suhu, gas, mode, jumlahAyam, tanggalMasuk, varietasAyam, siklusPanen, hargaPakan, modeBuzzer) {
  if (useMockFallback) {
    if (suhu !== undefined) mockSettings.suhuThreshold = suhu;
    if (gas !== undefined) mockSettings.gasThreshold = gas;
    if (mode !== undefined) mockSettings.modeKipas = mode;
    if (modeBuzzer !== undefined) mockSettings.modeBuzzer = modeBuzzer;
    if (jumlahAyam !== undefined) mockSettings.jumlahAyam = jumlahAyam;
    if (tanggalMasuk !== undefined) mockSettings.tanggalMasuk = tanggalMasuk;
    if (varietasAyam !== undefined) mockSettings.varietasAyam = varietasAyam;
    if (siklusPanen !== undefined) mockSettings.siklusPanen = siklusPanen;
    if (hargaPakan !== undefined) mockSettings.hargaPakan = hargaPakan;
    return mockSettings;
  }

  try {
    let query = 'UPDATE coop_settings SET ';
    const params = [];
    let count = 1;

    if (suhu !== undefined) {
      query += `suhu_threshold = $${count}, `;
      params.push(suhu);
      count++;
    }
    if (gas !== undefined) {
      query += `gas_threshold = $${count}, `;
      params.push(gas);
      count++;
    }
    if (mode !== undefined) {
      query += `mode_kipas = $${count}, `;
      params.push(mode);
      count++;
    }
    if (modeBuzzer !== undefined) {
      query += `mode_buzzer = $${count}, `;
      params.push(modeBuzzer);
      count++;
    }
    if (jumlahAyam !== undefined) {
      query += `jumlah_ayam = $${count}, `;
      params.push(jumlahAyam);
      count++;
    }
    if (tanggalMasuk !== undefined) {
      query += `tanggal_masuk = $${count}, `;
      params.push(tanggalMasuk);
      count++;
    }
    if (varietasAyam !== undefined) {
      query += `varietas_ayam = $${count}, `;
      params.push(varietasAyam);
      count++;
    }
    if (siklusPanen !== undefined) {
      query += `siklus_panen = $${count}, `;
      params.push(siklusPanen);
      count++;
    }
    if (hargaPakan !== undefined) {
      query += `harga_pakan = $${count}, `;
      params.push(hargaPakan);
      count++;
    }

    query = query.trim().replace(/,$/, '');
    query += ` WHERE id = (SELECT id FROM coop_settings LIMIT 1) 
              RETURNING suhu_threshold, gas_threshold, mode_kipas, mode_buzzer,
                        jumlah_ayam, tanggal_masuk, varietas_ayam, siklus_panen, harga_pakan`;

    const res = await pool.query(query, params);
    const row = res.rows[0];

    // Format tanggal
    let tanggalStr = tanggalMasuk;
    if (row.tanggal_masuk) {
      const d = new Date(row.tanggal_masuk);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      tanggalStr = `${yyyy}-${mm}-${dd}`;
    }

    return {
      suhuThreshold: row.suhu_threshold,
      gasThreshold: row.gas_threshold,
      modeKipas: row.mode_kipas,
      modeBuzzer: row.mode_buzzer || 0,
      jumlahAyam: row.jumlah_ayam,
      tanggalMasuk: tanggalStr,
      varietasAyam: row.varietas_ayam,
      siklusPanen: row.siklus_panen,
      hargaPakan: row.harga_pakan || 12000
    };
  } catch (err) {
    console.error("❌ Gagal updateSettings:", err.message);
    return mockSettings;
  }
}

// Telemetry Helpers
export async function addTelemetry(data) {
  const { suhu, kelembaban, gas, gasTerdeteksi, gerakan, kipas, led, buzzer } = data;

  if (useMockFallback) {
    const record = {
      id: mockIdCounter++,
      suhu,
      kelembaban,
      gas,
      gasTerdeteksi,
      gerakan,
      kipas,
      led,
      buzzer,
      timestamp: new Date().toISOString()
    };
    mockHistory.push(record);
    if (mockHistory.length > 50) {
      mockHistory.shift();
    }
    return record;
  }

  try {
    const query = `
      INSERT INTO telemetry_history (suhu, kelembaban, gas, gas_terdeteksi, gerakan, kipas, led, buzzer, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    const res = await pool.query(query, [suhu, kelembaban, gas, gasTerdeteksi, gerakan, kipas, led, buzzer]);
    return res.rows[0];
  } catch (err) {
    console.error("❌ Gagal addTelemetry:", err.message);
    useMockFallback = true;
    return addTelemetry(data);
  }
}

export async function getTelemetryHistory(limit = 20) {
  if (useMockFallback) {
    return mockHistory.slice(-limit);
  }

  try {
    const res = await pool.query(`
      SELECT id, suhu, kelembaban, gas, 
             gas_terdeteksi as "gasTerdeteksi", 
             gerakan, kipas, led, buzzer, 
             timestamp 
      FROM telemetry_history 
      ORDER BY timestamp DESC 
      LIMIT $1
    `, [limit]);

    return res.rows.reverse();
  } catch (err) {
    console.error("❌ Gagal getTelemetryHistory:", err.message);
    return mockHistory.slice(-limit);
  }
}
