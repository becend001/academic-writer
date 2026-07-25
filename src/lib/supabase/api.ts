import { createServerClient } from "@supabase/ssr";

/**
 * 从 Request 的 cookie 中创建服务端 Supabase client
 * 用于 API Route 中的身份验证和数据操作
 */
export function createClientFromRequest(request: Request) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader.split(";").filter(Boolean).map((c) => {
            const [name = "", ...val] = c.trim().split("=");
            return { name, value: val.join("=") };
          });
        },
        setAll() {
          // API Route 中不需要设置 cookie
        },
      },
    }
  );
}
