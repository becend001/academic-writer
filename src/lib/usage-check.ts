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
    const { data: whitelistEntry } = await supabase
      .from("whitelist")
      .select("id")
      .eq("email", userEmail.toLowerCase().trim())
      .maybeSingle();

    if (whitelistEntry) {
      return { allowed: true, whitelisted: true, todayUsage: 0, error: null };
    }

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
        error: `今日免费次数已用完（${DAILY_USAGE_LIMIT}次），请升级Pro版`,
      };
    }

    return { allowed: true, whitelisted: false, todayUsage, error: null };
  } catch {
    return { allowed: true, whitelisted: false, todayUsage: 0, error: null };
  }
}
