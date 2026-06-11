import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE = "ksn_token";

// Gate the /admin area on the presence of the auth cookie set by the Go API.
// (The API still authoritatively validates the JWT on every request.)
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(COOKIE)?.value);
  const isLogin = pathname === "/admin/login";
  const forceLogin = request.nextUrl.searchParams.get("force") === "1";

  if (pathname.startsWith("/admin") && !isLogin && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isLogin && hasToken && !forceLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
