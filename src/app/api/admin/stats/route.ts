import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";

function isAdmin(email: string | undefined): boolean {
  return email?.toLowerCase().trim() === ADMIN_EMAIL;
}

function getSupabaseFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "").trim();
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
}

export async function GET(request: Request) {
  const supabase = getSupabaseFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  try {
    // 总用户数
    const { count: totalUsers } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true });

    // 付费用户数
    const { count: paidUsers } = await supabase
      .from("user_profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_paid", true);

    // 今日活跃（今日有文档记录的用户数）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const { data: todayDocs } = await supabase
      .from("saved_works")
      .select("user_id")
      .gte("created_at", todayStart.toISOString());

    const todayActiveUsers = new Set(todayDocs?.map((d: any) => d.user_id)).size;

    // 今日AI调用次数（今日保存的文档数）
    const todayCallCount = todayDocs?.length || 0;

    // 最近5个注册用户
    const { data: recentUsers } = await supabase
      .from("user_profiles")
      .select("email, membership_level, is_paid, created_at")
      .order("created_at", { ascending: false })
      .limit(5);

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      paidUsers: paidUsers || 0,
      freeUsers: (totalUsers || 0) - (paidUsers || 0),
      todayActiveUsers,
      todayCallCount,
      recentUsers: recentUsers || [],
    });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
