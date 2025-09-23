import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { hasClerkKeys } from './utils/clerk';

// Protect /settings and any nested routes
const isProtectedRoute = createRouteMatcher(['/settings(.*)']);

const enabledMiddleware = clerkMiddleware((auth, req: NextRequest) => {
  if (isProtectedRoute(req)) {
    auth().protect();
  }
});

const disabledMiddleware = (req: NextRequest) => {
  if (isProtectedRoute(req)) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
};

export default hasClerkKeys ? enabledMiddleware : disabledMiddleware;

export const config = {
  // Skip static files and _next, protect everything else via the middleware above
  matcher: [
    '/((?!.+\\.[\\w]+$|_next).*)',
    '/(api)(.*)'
  ],
};
