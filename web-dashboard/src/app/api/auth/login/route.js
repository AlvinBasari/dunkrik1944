import { getUserByEmail, hashPassword, initDb } from '../../../../lib/db';
import { signToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

let dbInitialized = false;

async function ensureDb() {
  if (!dbInitialized) {
    await initDb();
    dbInitialized = true;
  }
}

export async function POST(request) {
  try {
    await ensureDb();
    
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ status: "error", message: "Email dan password wajib diisi" }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Cari user
    const user = await getUserByEmail(email);
    if (!user) {
      return new Response(JSON.stringify({ status: "error", message: "Email atau password salah" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Bandingkan password terenkripsi
    const hashedInput = hashPassword(password);
    if (user.password !== hashedInput) {
      return new Response(JSON.stringify({ status: "error", message: "Email atau password salah" }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Generate token JWT buatan
    const token = signToken({
      email: user.email,
      role: user.role
    });

    // Kembalikan respon sukses dengan Set-Cookie HTTP-Only
    const cookie = `token=${token}; Path=/; HttpOnly; Max-Age=86400; SameSite=Lax; Secure`;
    
    return new Response(JSON.stringify({
      status: "ok",
      user: {
        email: user.email,
        role: user.role
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });
  } catch (error) {
    console.error("Error in POST /api/auth/login:", error);
    return new Response(JSON.stringify({ status: "error", message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
