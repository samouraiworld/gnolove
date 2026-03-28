import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const MEMBA_GNOLOVE_URL = 'https://memba.samourai.app/gnolove'

export function middleware(_req: NextRequest) {
  return NextResponse.redirect(MEMBA_GNOLOVE_URL, { status: 301 })
}

export const config = {
  // Redirect all page routes; exclude static assets and _next internals
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|ico|webmanifest)).*)',],
}
