import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const FREE_DAILY_LIMIT = 3;

/**
 * 检查用户今日使用次数是否超限
 * 返回 { allowed: boolean, error?: string }
 */
export async function checkDailyLimit(request: Request): Promise<{ allowed: boolean; error?: string }> {
  try {
    // 从Authorization header获取token
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      // 无token，允许（未登录用户也允许调用，但客户端会限制）
      return { allowed: true };
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { allowed: true };

    // 检查是否在白名单中（不限次数）
    const { data: whitelistEntry } = await supabase
      .from("whitelist")
      .select("id")
      .eq("email", user.email?.toLowerCase().trim())
      .maybeSingle();

    if (whitelistEntry) return { allowed: true };

    // 检查是否是付费用户
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("membership_level, is_paid, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.is_paid) {
      // 检查是否过期
      if (!profile.expires_at || new Date(profile.expires_at) > new Date()) {
        return { allowed: true };
      }
    }

    // 免费用户，检查今日使用量
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    if ((count || 0) >= FREE_DAILY_LIMIT) {
      return {
        allowed: false,
        error: `今日免费次数已用完（${FREE_DAILY_LIMIT}次/天），请升级套餐或明天再试`,
      };
    }

    return { allowed: true };
  } catch {
    // 检查失败不阻塞请求
    return { allowed: true };
  }
}
