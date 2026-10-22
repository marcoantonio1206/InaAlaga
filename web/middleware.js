import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();

  // Demo role headers (set by client-side role switcher)
  const demoRole = request.headers.get('x-demo-role');
  const demoStation = request.headers.get('x-demo-station');
  const demoWorker = request.headers.get('x-demo-worker');
  const demoToken = request.headers.get('x-demo-mother-token');
  const demoSessionId = request.headers.get('x-demo-session-id');

  // Forward demo context to API routes via headers
  if (demoRole) response.headers.set('x-demo-role', demoRole);
  if (demoStation) response.headers.set('x-demo-station', demoStation);
  if (demoWorker) response.headers.set('x-demo-worker', demoWorker);
  if (demoToken) response.headers.set('x-demo-mother-token', demoToken);
  if (demoSessionId) response.headers.set('x-demo-session-id', demoSessionId);

  // For API routes, also pass as cookies for Supabase RLS (if using cookie-based auth)
  // This is a demo-only approach; production would use proper auth

  return response;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/hospital/:path*',
    '/bhw/:path*',
    '/m/:path*'
  ]
};