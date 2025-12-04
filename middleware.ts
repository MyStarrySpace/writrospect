import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Stack Auth handles its own routes via /handler/[...stack]
// Route protection is handled at the page level with getUser({ or: "redirect" })
// This middleware just ensures proper request handling

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icons, manifest
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.ico$|manifest.json|sw.js).*)",
  ],
};
