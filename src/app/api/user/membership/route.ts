import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 });
    }

    // 查询用户会员信息
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("membership_level, is_paid, expires_at, created_at")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      profile: profile || {
        membership_level: "free",
        is_paid: false,
        expires_at: null,
        created_at: null,
      },
    });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
