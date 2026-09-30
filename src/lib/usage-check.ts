import { SupabaseClient } from "@supabase/supabase-js";
import { DAILY_USAGE_LIMIT } from "./config";

/**
 * 服务端检查用户今日使用量
 * 需要传入已认证的 Supabase client
 */
export async function checkDailyUsage(
  supabase: SupabaseClient,
  userEmail: string,
  userId: string
) {
  try {
    // 1. 检查白名单（不限次数）
    const { data: whitelistEntry } = await supabase
      .from("whitelist")
      .select("id")
      .eq("email", userEmail.toLowerCase().trim())
      .maybeSingle();

    if (whitelistEntry) {
      return { allowed: true, whitelisted: true, todayUsage: 0, error: null };
    }

    // 2. 检查付费用户（不限次数）
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("membership_level, is_paid, expires_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (profile?.is_paid) {
      // 检查是否过期
      if (!profile.expires_at || new Date(profile.expires_at) > new Date()) {
        return { allowed: true, whitelisted: false, paidUser: true, todayUsage: 0, error: null };
      }
    }

    // 3. 免费用户，检查今日使用量
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", todayStart.toISOString());

    const todayUsage = count || 0;

    if (todayUsage >= DAILY_USAGE_LIMIT) {
      return {
        allowed: false,
        whitelisted: false,
        todayUsage,
        error: `今日免费次数已用完（${DAILY_USAGE_LIMIT}次/天），请升级套餐或明天再试`,
      };
    }

    return { allowed: true, whitelisted: false, todayUsage, error: null };
  } catch {
    return { allowed: false, whitelisted: false, todayUsage: 0, error: "服务暂时不可用，请稍后重试" };
  }
}
