import { NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ADMIN_EMAIL = "xiangbow@126.com";

function isAdmin(email: string | undefined): boolean {
  return email?.toLowerCase().trim() === ADMIN_EMAIL;
}

// 从Authorization header中获取token，创建带鉴权的Supabase客户端
function getSupabaseFromRequest(request: Request): SupabaseClient {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (token) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

async function requireAdmin(request: Request) {
  const supabase = getSupabaseFromRequest(request);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) return { supabase: null, user: null, error: "请先登录" };
  if (!isAdmin(user.email)) return { supabase: null, user: null, error: "无权限" };
  return { supabase, user, error: null };
}

export async function GET(request: Request) {
  const { supabase, error } = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error }, { status: 403 });

  const { data, error: dbError } = await supabase
    .from("whitelist")
    .select("*")
    .order("created_at", { ascending: false });

  if (dbError) return NextResponse.json({ error: "查询失败" }, { status: 500 });
  return NextResponse.json({ list: data || [] });
}

export async function POST(request: Request) {
  const { supabase, user, error } = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error }, { status: 403 });

  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "请提供邮箱" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const { error: dbError } = await supabase
    .from("whitelist")
    .insert({ email: normalizedEmail, created_by: user!.email });

  if (dbError) {
    if (dbError.code === "23505") return NextResponse.json({ error: "该邮箱已在白名单中" }, { status: 400 });
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { supabase, error } = await requireAdmin(request);
  if (!supabase) return NextResponse.json({ error }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "请提供记录ID" }, { status: 400 });

  const { error: dbError } = await supabase.from("whitelist").delete().eq("id", id);
  if (dbError) return NextResponse.json({ error: "删除失败" }, { status: 500 });

  return NextResponse.json({ success: true });
}
