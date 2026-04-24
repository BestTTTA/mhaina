import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = ['/profile', '/diary', '/pin/new', '/map'];

export function middleware(request: NextRequest) {
  // Note: Auth check would be done client-side in this app
  // This middleware can be extended for server-side auth checks if needed
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
