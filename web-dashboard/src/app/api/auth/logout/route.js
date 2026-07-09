export async function POST() {
  // Hapus cookie dengan Max-Age=0
  const cookie = 'token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
  
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
}

// Support GET logout untuk redirect/link biasa jika diperlukan
export async function GET() {
  const cookie = 'token=; Path=/; HttpOnly; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; Secure';
  
  return new Response(JSON.stringify({ status: "ok" }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
}
