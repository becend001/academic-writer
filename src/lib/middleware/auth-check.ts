import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 服务端auth检查 — 验证请求是否来自已登录用户
 * 注意：使用anon key + getUser()，依赖RLS保护数据
 */
export async function verifyAuth(request: Request) {
  // 从cookie中获取access_token
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [key, ...val] = c.trim().split("=");
      return [key, val.join("=")];
    })
  );

  // 尝试从localStorage的session cookie获取token
  // Supabase在cookie中存储格式: sb-<ref>-auth-token=<base64>
  let token = "";
  for (const [key, value] of Object.entries(cookies)) {
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      try {
        const decoded = JSON.parse(atob(value));
        token = decoded?.access_token || "";
      } catch {
        token = value;
      }
      break;
    }
  }

  if (!token) {
    return { user: null, error: "请先登录" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: "请先登录" };
  }

  return { user, error: null };
}
