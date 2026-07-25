import { NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";

/**
 * 从请求中获取用户标识（优先用user ID，fallback到IP）
 */
function getIdentifier(request: Request): string {
  // 尝试从 cookie 中获取用户ID（简单方式）
  const cookies = request.headers.get("cookie") || "";
  const sessionMatch = cookies.match(/sb-[a-z0-9]+-auth-token=([^;]+)/);
  if (sessionMatch?.[1]) {
    return `user:${sessionMatch[1].substring(0, 32)}`;
  }

  // fallback: 用IP地址
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0] || "unknown";
  return `ip:${ip}`;
}

/**
 * API路由限流包装
 * @param handler - 原始请求处理函数
 * @param config - 限流配置
 */
export function withRateLimit(
  handler: (request: Request, context?: any) => Promise<NextResponse>,
  config?: { maxRequests?: number; windowMs?: number }
) {
  return async (request: Request, context?: any) => {
    const identifier = getIdentifier(request);
    const { allowed, remaining, resetTime } = checkRateLimit(identifier, config);

    if (!allowed) {
      return NextResponse.json(
        {
          error: "请求过于频繁，请稍后再试",
          retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": String(config?.maxRequests || 10),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(resetTime / 1000)),
            "Retry-After": String(Math.ceil((resetTime - Date.now()) / 1000)),
          },
        }
      );
    }

    const response = await handler(request, context);
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    return response;
  };
}
