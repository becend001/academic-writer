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
  const token = authHeader.replace("Bearer ", "");
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: token ? { Authorization: `Bearer ${token}` } : {} },
  });
}

async function requireAdmin(request: Request) {
  const supabase = getSupabaseFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null, error: "请先登录" };
  if (!isAdmin(user.email)) return { supabase: null, user: null, error: "无权限" };
  return { supabase, user, error: null };
}

// GET: 获取用户列表（含使用量统计）
export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error }, { status: 403 });

  try {
    // 获取所有用户profile
    const { data: profiles, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileError) return NextResponse.json({ error: "查询失败" }, { status: 500 });

    // 为每个用户获取使用量
    const users = await Promise.all(
      (profiles || []).map(async (profile) => {
        // 总使用量
        const { count: totalCount } = await supabase
          .from("saved_works")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.user_id);

        // 今日使用量
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { count: todayCount } = await supabase
          .from("saved_works")
          .select("*", { count: "exact", head: true })
          .eq("user_id", profile.user_id)
          .gte("created_at", todayStart.toISOString());

        return {
          ...profile,
          totalUsage: totalCount || 0,
          todayUsage: todayCount || 0,
        };
      })
    );

    return NextResponse.json({ users });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

// PUT: 更新用户会员信息
export async function PUT(request: Request) {
  const { supabase, error } = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error }, { status: 403 });

  try {
    const body = await request.json();
    const { userId, membershipLevel, isPaid, expiresAt } = body;

    if (!userId) return NextResponse.json({ error: "缺少用户ID" }, { status: 400 });

    const updateData: any = {
      membership_level: membershipLevel || "free",
      is_paid: isPaid || false,
      updated_at: new Date().toISOString(),
    };

    if (isPaid && !updateData.paid_at) {
      updateData.paid_at = new Date().toISOString();
    }

    if (expiresAt) {
      updateData.expires_at = expiresAt;
    }

    const { error: updateError } = await supabase
      .from("user_profiles")
      .update(updateData)
      .eq("user_id", userId);

    if (updateError) return NextResponse.json({ error: "更新失败" }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}
