import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 需要登录才能访问的路径
const PROTECTED_PATHS = [
  "/workspace",
  "/grant",
  "/profile",
  "/literature",
  "/guide",
  "/workflow",
];

// API 路径中需要认证的前缀
const PROTECTED_API_PREFIXES = [
  "/api/works",
  "/api/user",
  "/api/admin",
  "/api/usage",
  "/api/grant",
  "/api/workflow",
  "/api/academic",
];

// 需要 CSRF 校验的方法
const CSRF_METHODS = new Set(["POST", "PUT", "DELETE", "PATCH"]);

// CSRF cookie 名称
const CSRF_COOKIE = "csrf_token";

function isProtectedPath(pathname: string): boolean {
  if (PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return true;
  }
  if (PROTECTED_API_PREFIXES.some((p) => pathname.startsWith(p))) {
    return true;
  }
  return false;
}

/**
 * 给 response 附加 CSRF cookie
 */
function attachCsrfCookie(request: NextRequest, response: NextResponse): NextResponse {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  const csrfToken = existing || crypto.randomUUID();
  response.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });
  return response;
}

function validateCsrf(request: NextRequest): boolean {
  if (!CSRF_METHODS.has(request.method)) return true;

  const pathname = request.nextUrl.pathname;
  if (pathname === "/api/admin/check") return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

export async function middleware(request: NextRequest) {
  // CSRF 校验
  if (!validateCsrf(request)) {
    return attachCsrfCookie(request, NextResponse.json(
      { error: "CSRF 验证失败" },
      { status: 403 }
    ));
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 静默刷新 session
  await supabase.auth.getUser().catch(() => {});

  // 服务端路由保护
  if (isProtectedPath(request.nextUrl.pathname)) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return attachCsrfCookie(request, NextResponse.json(
          { error: "请先登录" },
          { status: 401 }
        ));
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return attachCsrfCookie(request, NextResponse.redirect(loginUrl));
    }
  }

  // 种 CSRF cookie
  return attachCsrfCookie(request, supabaseResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
