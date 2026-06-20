import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken, getTenantId } from "@/lib/auth";

const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/api/health",
  "/api/webhooks",
  "/api/mcp",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for token in cookie or header
  const token =
    request.cookies.get("token")?.value ||
    request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const user = await verifyToken(token);
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Add user data to headers for Server Actions
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", user.id);
  requestHeaders.set("x-tenant-id", getTenantId(user));
  requestHeaders.set("x-tenant-plan", user.tenantPlan ?? "");

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
