import { NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/api";

// GET: 获取单个工作记录（只允许查看自己的）
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("saved_works")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "记录不存在" }, { status: 404 });
    }

    return NextResponse.json({ work: data });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// PUT: 更新工作记录（只允许更新自己的）
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();

    // 白名单校验：只允许更新安全字段，防止批量赋值
    const allowedFields: Record<string, unknown> = {};
    if (body.title !== undefined) allowedFields.title = String(body.title).slice(0, 200);
    if (body.content !== undefined) allowedFields.content = String(body.content);
    if (body.result !== undefined) allowedFields.result = String(body.result);
    if (body.feature !== undefined) allowedFields.feature = String(body.feature).slice(0, 50);

    const { data, error } = await supabase
      .from("saved_works")
      .update({
        ...allowedFields,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "更新失败" }, { status: 500 });
    }

    return NextResponse.json({ work: data });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE: 删除工作记录（只允许删除自己的）
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createClientFromRequest(request);
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { error } = await supabase
      .from("saved_works")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: "删除失败" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
