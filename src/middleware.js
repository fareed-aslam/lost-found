import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { verifyAdminToken } from "./utils/adminAuthEdge";

const PUBLIC_ROUTES = [
  "/",
  "/lost",
  "/admin/login",
  "/admin",
  "/auth/login",
  "/auth/signup",
  "/api/auth",
  "/api/auth/callback",
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (
    PUBLIC_ROUTES.includes(pathname) ||
    PUBLIC_ROUTES.some(
      (route) => pathname !== route && pathname.startsWith(route + "/")
    )
  ) {
    return NextResponse.next();
  }

  // If an admin token cookie is present and valid, redirect /report to /admin
  try {
    if (pathname === "/report") {
      let adminToken = null;
      try {
        const cookie = req.cookies.get("admin_token");
        if (cookie && cookie.value) adminToken = cookie.value;
      } catch (e) {
        // older Next versions may not support req.cookies.get in middleware
        const header = req.headers.get("cookie") || "";
        const parts = header.split(";").map((p) => p.trim());
        for (const p of parts) {
          if (p.startsWith("admin_token=")) {
            adminToken = p.slice("admin_token=".length);
            break;
          }
        }
      }
      if (adminToken) {
        try {
          // strip quotes and decode
          adminToken = adminToken.replace(/^"|"$/g, "");
          try {
            adminToken = decodeURIComponent(adminToken);
          } catch (e) {}
          const ok = await verifyAdminToken(adminToken);
          if (ok) {
            return NextResponse.redirect(new URL("/admin", req.url));
          }
        } catch (e) {
          // ignore verification errors here
        }
      }
    }
  } catch (e) {
    // swallow middleware errors to avoid blocking requests
  }

  const token = await getToken({ req, secret: process.env.NEXT_AUTH_SECRET });

  if (!token) {
    // If user is trying to access admin paths, redirect to admin login page
    if (pathname.startsWith("/admin")) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", req.url);
      return NextResponse.redirect(loginUrl);
    }

    const loginUrl = new URL("/auth/login", req.url);
    loginUrl.searchParams.set("callbackUrl", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|api/auth|node_modules).*)",
  ],
};
