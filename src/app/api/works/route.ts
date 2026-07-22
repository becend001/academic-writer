import { NextResponse } from "next/server";
import { saveWork, getWorks } from "@/lib/supabase/works";

// GET: 获取工作记录列表
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    const works = await getWorks(limit);
    return NextResponse.json({ works });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: 保存工作记录
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, content, result, feature } = body;

    if (!content || !feature) {
      return NextResponse.json(
        { error: "缺少必要参数" },
        { status: 400 }
      );
    }

    const work = await saveWork({
      title: title || "未命名文档",
      content,
      result,
      feature,
    });

    return NextResponse.json({ work });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
