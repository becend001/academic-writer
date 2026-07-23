import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_EMAIL = "xiangbow@126.com";

function isAdmin(email: string | undefined): boolean {
  return email?.toLowerCase().trim() === ADMIN_EMAIL;
}

// GET: 获取白名单列表
export async function GET(request: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from("whitelist")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }

  return NextResponse.json({ list: data || [] });
}

// POST: 添加邮箱到白名单
export async function POST(request: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { email } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "请提供邮箱" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  const { error } = await supabaseAdmin
    .from("whitelist")
    .insert({ email: normalizedEmail, created_by: user.email });

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "该邮箱已在白名单中" }, { status: 400 });
    }
    return NextResponse.json({ error: "添加失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE: 从白名单移除
export async function DELETE(request: Request) {
  const { data: { user } } = await supabaseAdmin.auth.getUser();
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: "无权限" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "请提供记录ID" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("whitelist")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
