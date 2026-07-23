import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { field, keywords, projectType } = await request.json();

    if (!field) {
      return NextResponse.json(
        { error: "请提供研究领域" },
        { status: 400 }
      );
    }

    // 步骤1：生成选题建议
    const topicResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的科研项目申报专家。请根据用户的研究领域，推荐3个适合申报${projectType || "国自然面上项目"}的选题。

每个选题包含：
- 项目名称
- 研究意义
- 创新点
- 可行性分析
- 预期成果

请以JSON格式输出：
{
  "topics": [
    {
      "title": "选题名称",
      "significance": "研究意义",
      "innovation": "创新点",
      "feasibility": "可行性分析",
      "expectedOutput": "预期成果"
    }
  ]
}`,
        },
        {
          role: "user",
          content: `研究领域：${field}\n关键词：${keywords || "未指定"}`,
        },
      ],
      { temperature: 0.7, maxTokens: 2000 }
    );

    let topics: any[] = [];
    try {
      const jsonMatch = topicResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        topics = parsed.topics || [];
      }
    } catch {
      topics = [];
    }

    // 步骤2：生成写作大纲
    const outlineResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的科研项目申报专家。请为${projectType || "国自然面上项目"}生成标准的写作大纲。

大纲应包含：
一、立项依据
  1.1 研究背景
  1.2 国内外研究现状
  1.3 研究意义
二、研究内容
  2.1 研究目标
  2.2 研究内容
  2.3 拟解决的关键问题
三、研究方案
  3.1 技术路线
  3.2 实验方案
  3.3 可行性分析
四、特色与创新
五、年度计划
六、预期成果
七、经费预算

请以JSON格式输出大纲结构。`,
        },
        {
          role: "user",
          content: `研究领域：${field}`,
        },
      ],
      { temperature: 0.5, maxTokens: 1000 }
    );

    let outline: any = { sections: [] };
    try {
      const jsonMatch = outlineResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        outline = JSON.parse(jsonMatch[0]);
      }
    } catch {
      outline = {
        sections: [
          { title: "一、立项依据", subsections: ["1.1 研究背景", "1.2 国内外研究现状", "1.3 研究意义"] },
          { title: "二、研究内容", subsections: ["2.1 研究目标", "2.2 研究内容", "2.3 拟解决的关键问题"] },
          { title: "三、研究方案", subsections: ["3.1 技术路线", "3.2 实验方案", "3.3 可行性分析"] },
          { title: "四、特色与创新" },
          { title: "五、年度计划" },
          { title: "六、预期成果" },
          { title: "七、经费预算" },
        ],
      };
    }

    // 步骤3：生成各章节要点
    const pointsResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的科研项目申报专家。请为以下研究领域生成各章节的写作要点。

研究领域：${field}

每个章节需要包含：
1. 需要包含的要点（3-5个）
2. 每个要点的简要说明
3. 建议字数

请以JSON格式输出：
{
  "points": {
    "background": {
      "title": "立项依据",
      "items": [{"point": "要点", "description": "说明"}],
      "suggestedWords": 2000
    }
  }
}`,
        },
        {
          role: "user",
          content: "请生成各章节要点",
        },
      ],
      { temperature: 0.5, maxTokens: 2000 }
    );

    let points: any = {};
    try {
      const jsonMatch = pointsResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        points = JSON.parse(jsonMatch[0]);
      }
    } catch {
      points = {};
    }

    // 返回完整结果
    return NextResponse.json({
      topics,
      outline,
      points,
    });
  } catch (error: any) {
    console.error("课题申报工作流错误:", error);
    return NextResponse.json(
      { error: "处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
