import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Add error suppression headers
  const response = NextResponse.next();
  
  // Add headers to help with error suppression
  response.headers.set('X-Error-Suppression', 'active');
  response.headers.set('X-Fetch-Override', 'enabled');
  
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
