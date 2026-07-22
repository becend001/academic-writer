import { NextResponse } from "next/server";
import { getWork, updateWork, deleteWork } from "@/lib/supabase/works";

async function requireAuth(request: Request) {
  const cookies = request.headers.get("cookie") || "";
  const hasSession = cookies.split(";").some((c) => {
    const key = c.trim().split("=")[0];
    return key.startsWith("sb-") && key.endsWith("-auth-token");
  });
  return hasSession;
}

// GET: 获取单个工作记录
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const work = await getWork(id);
    return NextResponse.json({ work });
  } catch {
    return NextResponse.json({ error: "获取失败" }, { status: 500 });
  }
}

// PUT: 更新工作记录
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const work = await updateWork(id, body);
    return NextResponse.json({ work });
  } catch {
    return NextResponse.json({ error: "更新失败" }, { status: 500 });
  }
}

// DELETE: 删除工作记录
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAuth(request))) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteWork(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
