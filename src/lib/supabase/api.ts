import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClientFromRequest(request: Request): SupabaseClient {
  // 1. 优先从 Authorization header 获取 token（前端传入）
  const authHeader = request.headers.get("authorization") || "";
  const bearerToken = authHeader.replace("Bearer ", "").trim();

  // 2. 兼容从 cookie 获取
  let cookieToken = "";
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const trimmed = cookie.trim();
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.substring(0, eqIndex);
    const value = trimmed.substring(eqIndex + 1);
    if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
      try {
        const decoded = JSON.parse(atob(value));
        cookieToken = decoded?.access_token || "";
      } catch {}
      break;
    }
  }

  const token = bearerToken || cookieToken;

  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}
