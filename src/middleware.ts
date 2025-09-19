import { clerkMiddleware, ClerkMiddlewareAuth, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest } from 'next/server';

// Protect /settings and any nested routes
const isProtectedRoute = createRouteMatcher(['/settings(.*)']);

export default clerkMiddleware((auth: ClerkMiddlewareAuth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

export const config = {
  // Skip static files and _next, protect everything else via the middleware above
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/(api|trpc)(.*)'
  ],
};
