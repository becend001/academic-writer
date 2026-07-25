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
 * 双提交 Cookie 模式 CSRF 防护：
 * 1. 每个响应种一个 csrf_token cookie（httpOnly=false，JS 可读）
 * 2. 客户端发状态变更请求时，从 cookie 读 token 放到 X-CSRF-Token header
 * 3. middleware 校验 header === cookie
 */
function getCsrfToken(request: NextRequest): string {
  const existing = request.cookies.get(CSRF_COOKIE)?.value;
  if (existing) return existing;
  // Edge runtime 可用 crypto.randomUUID()
  return crypto.randomUUID();
}

function validateCsrf(request: NextRequest): boolean {
  // 只校验状态变更请求
  if (!CSRF_METHODS.has(request.method)) return true;

  // 跳过不涉及用户状态的公开 API
  const pathname = request.nextUrl.pathname;
  if (pathname === "/api/admin/check") return true;

  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value;
  const headerToken = request.headers.get("x-csrf-token");

  if (!cookieToken || !headerToken) return false;
  return cookieToken === headerToken;
}

export async function middleware(request: NextRequest) {
  // CSRF 校验（在 Supabase 初始化之前，减少开销）
  if (!validateCsrf(request)) {
    return NextResponse.json(
      { error: "CSRF 验证失败" },
      { status: 403 }
    );
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
        return NextResponse.json(
          { error: "请先登录" },
          { status: 401 }
        );
      }
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 种 CSRF cookie（每个响应都刷新，确保 token 有效）
  const csrfToken = getCsrfToken(request);
  supabaseResponse.cookies.set(CSRF_COOKIE, csrfToken, {
    httpOnly: false,  // 前端 JS 需要读取
    sameSite: "lax",  // 跨站 GET 不发送，POST 时发送
    path: "/",
    maxAge: 60 * 60,  // 1 小时过期
  });

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
