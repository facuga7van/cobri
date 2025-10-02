import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Si la ruta no tiene locale, redirigir a /es
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/es', request.url));
  }
  
  // Si la ruta tiene un locale válido, continuar
  if (pathname.startsWith('/es') || pathname.startsWith('/en')) {
    return NextResponse.next();
  }
  
  // Para otras rutas, redirigir a /es
  return NextResponse.redirect(new URL('/es', request.url));
}

export const config = {
  matcher: ['/', '/(es|en)/:path*']
};
