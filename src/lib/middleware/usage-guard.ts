import { NextResponse } from "next/server";
import { verifyAuth } from "./auth-check";
import { checkDailyUsage } from "../usage-check";

/**
 * API路由用量守卫 — 包装AI接口处理函数
 * 自动检查用户今日使用次数，白名单用户不受限
 */
export function withUsageLimit(
  handler: (request: Request, context?: any) => Promise<NextResponse>
) {
  return async (request: Request, context?: any) => {
    const { user, error } = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: error || "请先登录" }, { status: 401 });
    }

    const { allowed, todayUsage, error: usageError } = await checkDailyUsage(
      user.email || "",
      user.id
    );

    if (!allowed) {
      return NextResponse.json(
        {
          error: usageError,
          todayUsage,
          limit: 3,
        },
        { status: 429 }
      );
    }

    return handler(request, context);
  };
}
