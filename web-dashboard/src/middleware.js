import { NextResponse } from 'next/server';

export function middleware(request) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Halaman yang dilindungi (dashboard utama)
  const isDashboardPath = pathname === '/';
  // Halaman login
  const isLoginPath = pathname === '/login';

  // Jika mencoba mengakses dashboard tapi tidak ada token, arahkan ke login
  if (isDashboardPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Jika sudah login tapi mencoba ke halaman login, arahkan balik ke dashboard
  if (isLoginPath && token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Tentukan path mana saja yang akan dicegat oleh middleware
export const config = {
  matcher: ['/', '/login']
};
