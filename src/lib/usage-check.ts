import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DAILY_LIMIT = 3;

/**
 * 服务端检查用户今日使用量
 * 返回 { allowed, whitelisted, todayUsage, error }
 */
export async function checkDailyUsage(userEmail: string, userId: string) {
  try {
    // 匿名客户端检查白名单（无需auth token）
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: whitelistEntry } = await supabase
      .from("whitelist")
      .select("id")
      .eq("email", userEmail.toLowerCase().trim())
      .maybeSingle();

    if (whitelistEntry) {
      return { allowed: true, whitelisted: true, todayUsage: 0, error: null };
    }

    // 查询今日使用量
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString());

    const todayUsage = count || 0;

    if (todayUsage >= DAILY_LIMIT) {
      return {
        allowed: false,
        whitelisted: false,
        todayUsage,
        error: `今日免费次数已用完（${DAILY_LIMIT}次），请升级Pro版`,
      };
    }

    return { allowed: true, whitelisted: false, todayUsage, error: null };
  } catch {
    // 查询失败时放行，避免误拦用户
    return { allowed: true, whitelisted: false, todayUsage: 0, error: null };
  }
}

/**
 * 服务端记录一次使用量（插入saved_works）
 */
export async function recordUsage(userId: string, feature: string, title: string, content: string, result: string) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    await supabase.from("saved_works").insert({
      user_id: userId,
      title,
      content: content.substring(0, 200),
      result: result.substring(0, 200),
      feature,
    });
  } catch {}
}
