import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Safeguard: Check if this is an exempted route
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname === "/api/cron/sync" ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const expectedPassword = process.env.DASHBOARD_PASSWORD || "admin";
  const sessionCookie = request.cookies.get("dashboard_session")?.value;

  if (sessionCookie !== expectedPassword) {
    const loginUrl = new URL("/login", request.url);
    // Remember where we wanted to go
    if (pathname !== "/") {
      loginUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply proxy to all routes except public API endpoints and assets
    "/((?!api/cron/sync|api/login|_next/static|_next/image|favicon.ico|login).*)",
  ],
};
