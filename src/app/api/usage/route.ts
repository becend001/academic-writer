import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    const { data: { user } } = await supabaseAdmin.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }

    // 今日起始时间
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    // 查询今日使用量（今日保存的文档数）
    const { count: todayCount } = await supabaseAdmin
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", todayStart.toISOString());

    // 查询总使用量
    const { count: totalCount } = await supabaseAdmin
      .from("saved_works")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      today: todayCount || 0,
      total: totalCount || 0,
    });
  } catch (error: any) {
    return NextResponse.json({ today: 0, total: 0 });
  }
}
