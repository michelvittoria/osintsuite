import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Locale detection — cookie > host > default en
  const cookieLocale = req.cookies.get("NEXT_LOCALE")?.value as "en" | "pt" | undefined;
  const host = req.headers.get("host") ?? "";
  let locale: "en" | "pt" = "en";

  if (cookieLocale === "en" || cookieLocale === "pt") {
    locale = cookieLocale;
  } else if (host.includes(".br")) {
    locale = "pt";
  }

  if (locale !== "en") {
    res.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
  }

  // Security headers
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "no-referrer");
  res.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  // CSP — restrictive but allows inline styles/scripts needed by Next.js
  res.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-eval for dev
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ")
  );

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/scan/:path*",
    "/((?!_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};