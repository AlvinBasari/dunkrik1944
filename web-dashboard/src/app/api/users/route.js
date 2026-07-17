import { initDb, getUsers, createUser, deleteUser } from '../../../lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

// Cek otentikasi admin/user sebelum memproses
function authenticate() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET: Ambil daftar seluruh user (hanya untuk user yang login)
export async function GET() {
  try {
    const authUser = authenticate();
    if (!authUser) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureDb();
    const users = await getUsers();
    
    return new Response(JSON.stringify({
      status: "ok",
      users
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in GET /api/users:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// POST: Tambah user baru (hanya untuk user yang login)
export async function POST(request) {
  try {
    const authUser = authenticate();
    if (!authUser) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const body = await request.json();
    const { email, password, role } = body;

    // Validasi
    if (!email || !password) {
      return new Response(JSON.stringify({ status: "error", message: "Email dan password wajib diisi" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureDb();
    const newUser = await createUser(email, password, role || 'owner');
    
    if (!newUser) {
      return new Response(JSON.stringify({ status: "error", message: "Gagal membuat user baru atau email sudah terdaftar" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      status: "ok",
      user: newUser
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in POST /api/users:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// DELETE: Hapus user berdasarkan ID (tidak boleh menghapus diri sendiri)
export async function DELETE(request) {
  try {
    const authUser = authenticate();
    if (!authUser) {
      return new Response(JSON.stringify({ status: "error", message: "Unauthorized" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return new Response(JSON.stringify({ status: "error", message: "Parameter id wajib disertakan" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await ensureDb();
    const deleted = await deleteUser(id);

    if (!deleted) {
      return new Response(JSON.stringify({ status: "error", message: "User tidak ditemukan atau gagal dihapus" }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      status: "ok",
      message: "User berhasil dihapus",
      user: deleted
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error("Error in DELETE /api/users:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
