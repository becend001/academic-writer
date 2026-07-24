import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * 服务端auth检查 — 从 cookie 中验证用户身份
 * 使用 next/headers 读取最新 cookie（含 middleware 刷新后的 token）
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
        setAll() {
          // API route 中不需要 set cookies
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "请先登录" };
  }

  return { user, error: null };
}
