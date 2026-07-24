import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/api";

// GET: 获取工作记录列表（只返回自己的）
export async function GET(request: Request) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20")), 50);

    const { data, error } = await supabase
      .from("saved_works")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: "查询失败" }, { status: 500 });
    }

    return NextResponse.json({ works: data || [] });
  } catch {
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

// POST: 保存工作记录
export async function POST(request: Request) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, content, result, feature } = body;

    if (!content || !feature) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("saved_works")
      .insert({
        user_id: user.id,
        title: title || "未命名文档",
        content,
        result,
        feature,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "保存失败" }, { status: 500 });
    }

    return NextResponse.json({ work: data });
  } catch {
    return NextResponse.json({ error: "保存失败" }, { status: 500 });
  }
}
