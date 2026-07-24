import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { withRateLimit } from "@/lib/middleware/api-guard";

// 获取论文时间线列表
export const GET = withRateLimit(async (request: Request) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from("paper_timeline")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("获取论文时间线失败:", error);
      return NextResponse.json(
        { error: "获取失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      papers: data || [],
    });
  } catch (error: any) {
    console.error("获取论文时间线API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});

// 创建新论文
export const POST = withRateLimit(async (request: Request) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { paper_title, target_journal } = await request.json();

    if (!paper_title) {
      return NextResponse.json(
        { error: "请提供论文标题" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("paper_timeline")
      .insert({
        user_id: user.id,
        paper_title,
        status: "选题",
        target_journal,
        milestones: [
          {
            status: "选题",
            date: new Date().toISOString(),
            note: "创建论文",
          },
        ],
      })
      .select()
      .single();

    if (error) {
      console.error("创建论文失败:", error);
      return NextResponse.json(
        { error: "创建失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paper: data,
    });
  } catch (error: any) {
    console.error("创建论文API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});
