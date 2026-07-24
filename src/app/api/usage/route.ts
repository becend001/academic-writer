import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/api";

export async function GET(request: Request) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    // 检查是否在白名单中
    const { data: whitelistEntry } = await supabase
      .from("whitelist")
      .select("id")
      .eq("email", user.email?.toLowerCase().trim())
      .maybeSingle();

    const whitelisted = !!whitelistEntry;

    if (whitelisted) {
      return NextResponse.json({
        today: 0,
        total: 0,
        whitelisted: true,
      });
    }

    // 今日起始时间
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { count: todayCount } = await supabase
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    const { count: totalCount } = await supabase
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      today: todayCount || 0,
      total: totalCount || 0,
      whitelisted: false,
    });
  } catch {
    return NextResponse.json({ today: 0, total: 0, whitelisted: false });
  }
}
