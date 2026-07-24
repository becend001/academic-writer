import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";

// 获取用户学术档案
export const GET = withRateLimit(async (request: Request) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    // 获取或创建用户学术档案
    let { data: profile, error: profileError } = await supabase
      .from("user_academic_profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError && profileError.code === "PGRST116") {
      // 不存在，创建新档案
      const { data: newProfile, error: createError } = await supabase
        .from("user_academic_profile")
        .insert({
          user_id: user.id,
          research_fields: [],
          interests: [],
        })
        .select()
        .single();

      if (createError) {
        console.error("创建学术档案失败:", createError);
        return NextResponse.json(
          { error: "创建档案失败" },
          { status: 500 }
        );
      }
      profile = newProfile;
    } else if (profileError) {
      console.error("获取学术档案失败:", profileError);
      return NextResponse.json(
        { error: "获取档案失败" },
        { status: 500 }
      );
    }

    // 获取使用统计
    const { data: works, error: worksError } = await supabase
      .from("saved_works")
      .select("feature, created_at")
      .eq("user_id", user.id);

    // 统计各功能使用次数
    const featureStats: Record<string, number> = {};
    const monthlyActivity: Record<string, number> = {};

    if (works) {
      works.forEach((work) => {
        featureStats[work.feature] = (featureStats[work.feature] || 0) + 1;
        
        const month = new Date(work.created_at).toISOString().slice(0, 7);
        monthlyActivity[month] = (monthlyActivity[month] || 0) + 1;
      });
    }

    // 获取论文时间线数量
    const { count: paperCount } = await supabase
      .from("paper_timeline")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        stats: {
          totalActivities: works?.length || 0,
          featureStats,
          monthlyActivity,
          paperCount: paperCount || 0,
        },
      },
    });
  } catch (error: any) {
    console.error("获取用户档案API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});

// 更新用户学术档案
export const PUT = withRateLimit(async (request: Request) => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "请先登录" },
        { status: 401 }
      );
    }

    const { research_fields, interests } = await request.json();

    const { data, error } = await supabase
      .from("user_academic_profile")
      .update({
        research_fields: research_fields || [],
        interests: interests || [],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("更新学术档案失败:", error);
      return NextResponse.json(
        { error: "更新失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error: any) {
    console.error("更新用户档案API错误:", error);
    return NextResponse.json(
      { error: "服务暂时不可用" },
      { status: 500 }
    );
  }
});
