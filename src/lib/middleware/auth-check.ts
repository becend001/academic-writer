import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端auth检查 — 从 cookie 中验证用户身份
 * 返回 user + supabase client（可用于后续数据库操作）
 */
export async function verifyAuth(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, supabase, error: "请先登录" };
  }

  return { user, supabase, error: null };
}
