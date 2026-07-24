import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { withRateLimit } from "@/lib/middleware/api-guard";

// 获取单个论文详情
export const GET = withRateLimit(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
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
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: "论文不存在" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paper: data,
    });
  } catch (error: any) {
    console.error("获取论文详情API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});

// 更新论文状态
export const PUT = withRateLimit(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { status, target_journal, submission_date, decision_date, milestone_note } = await request.json();

    // 获取当前论文
    const { data: currentPaper } = await supabase
      .from("paper_timeline")
      .select("*")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (!currentPaper) {
      return NextResponse.json(
        { error: "论文不存在" },
        { status: 404 }
      );
    }

    // 构建更新数据
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status) {
      updateData.status = status;
      
      // 添加里程碑
      const milestones = currentPaper.milestones || [];
      milestones.push({
        status,
        date: new Date().toISOString(),
        note: milestone_note || `状态更新为：${status}`,
      });
      updateData.milestones = milestones;
    }

    if (target_journal !== undefined) updateData.target_journal = target_journal;
    if (submission_date !== undefined) updateData.submission_date = submission_date;
    if (decision_date !== undefined) updateData.decision_date = decision_date;

    const { data, error } = await supabase
      .from("paper_timeline")
      .update(updateData)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("更新论文失败:", error);
      return NextResponse.json(
        { error: "更新失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      paper: data,
    });
  } catch (error: any) {
    console.error("更新论文API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});

// 删除论文
export const DELETE = withRateLimit(async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("paper_timeline")
      .delete()
      .eq("id", params.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("删除论文失败:", error);
      return NextResponse.json(
        { error: "删除失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error: any) {
    console.error("删除论文API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});
