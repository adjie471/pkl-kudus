import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Ambil penanda session/cookie admin (sesuaikan nama cookie jika menggunakan Supabase Auth / Cookie khusus)
  const authCookie = request.cookies.get('admin_session')?.value || request.cookies.get('sb-access-token')?.value;

  // 2. Kategori path admin
  const isAdminRoute = path.startsWith('/admin');
  const isLoginPage = path === '/admin/login';

  // 3. Jika mencoba membuka halaman admin (selain /admin/login) dan BELUM login -> Redirect ke /admin/login
  if (isAdminRoute && !isLoginPage && !authCookie) {
    const loginUrl = new URL('/admin/login', request.url);
    // Simpan URL asal agar setelah login bisa diarahkan kembali
    loginUrl.searchParams.set('redirect', path);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Jika SUDAH login tapi mencoba membuka halaman /admin/login -> Redirect langsung ke /admin
  if (isLoginPage && authCookie) {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

// Tentukan route mana saja yang diproteksi middleware ini
export const config = {
  matcher: ['/admin/:path*'],
};