import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { withRateLimit } from "@/lib/middleware/api-guard";

// 导出用户所有数据
export const GET = withRateLimit(async (request: Request) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 获取用户基本信息
    const userInfo = {
      email: user.email,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
    };

    // 获取学术档案
    const { data: profile } = await supabase
      .from("user_academic_profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    // 获取保存的作品
    const { data: works } = await supabase
      .from("saved_works")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 获取论文时间线
    const { data: papers } = await supabase
      .from("paper_timeline")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 获取课题项目
    const { data: grantProjects } = await supabase
      .from("grant_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // 构建导出数据
    const exportData = {
      exportDate: new Date().toISOString(),
      userInfo,
      academicProfile: profile,
      savedWorks: works || [],
      paperTimeline: papers || [],
      grantProjects: grantProjects || [],
      statistics: {
        totalWorks: works?.length || 0,
        totalPapers: papers?.length || 0,
        totalGrantProjects: grantProjects?.length || 0,
        featureUsage: calculateFeatureUsage(works || []),
      },
    };

    return NextResponse.json({
      success: true,
      data: exportData,
    });
  } catch (error: any) {
    console.error("导出数据API错误:", error);
    return NextResponse.json(
      { error: "导出失败" },
      { status: 500 }
    );
  }
});

// 计算功能使用统计
function calculateFeatureUsage(works: any[]): Record<string, number> {
  const usage: Record<string, number> = {};
  works.forEach((work) => {
    const feature = work.feature || "unknown";
    usage[feature] = (usage[feature] || 0) + 1;
  });
  return usage;
}
