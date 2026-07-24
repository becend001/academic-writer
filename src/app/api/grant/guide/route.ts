import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { field, keywords, idea, projectType, outputType } = await request.json();

    if (!field) {
      return NextResponse.json(
        { error: "请提供研究领域" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一位资深的科研项目申报专家和学术写作导师。请根据用户的研究想法，生成完整的写作方案。

用户信息：
- 研究领域：${field}
- 关键词：${keywords || "未提供"}
- 研究想法：${idea || "未提供"}
- 项目类型：${projectType || "国自然面上项目"}

请生成以下内容：

1. 推荐选题（3个）
   每个选题包含：
   - 项目名称
   - 研究意义
   - 创新点
   - 可行性分析
   - 预期成果

2. 写作大纲
   按照${projectType || "国自然面上项目"}的标准格式，包含：
   - 一、立项依据（研究背景、国内外研究现状、研究意义）
   - 二、研究内容（研究目标、研究内容、关键问题）
   - 三、研究方案（技术路线、实验方案、可行性分析）
   - 四、特色与创新
   - 五、年度计划
   - 六、预期成果
   - 七、经费预算

3. 各章节要点
   为每个章节提供：
   - 需要包含的要点（3-5个）
   - 每个要点的简要说明
   - 建议字数

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
  ],
  "outline": {
    "sections": [
      {
        "id": "background",
        "title": "立项依据",
        "subsections": [
          {"id": "research_background", "title": "研究背景"},
          {"id": "research_status", "title": "国内外研究现状"},
          {"id": "research_significance", "title": "研究意义"}
        ]
      }
    ]
  },
  "points": {
    "background": {
      "title": "立项依据",
      "items": [
        {"point": "要点1", "description": "说明"},
        {"point": "要点2", "description": "说明"}
      ],
      "suggestedWords": 2000
    }
  }
}`;

    const result = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成写作方案" },
      ],
      { temperature: 0.7, maxTokens: 6000 }
    );

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
      }
    } catch {
      // JSON解析失败，返回纯文本
    }

    return NextResponse.json({ 
      rawContent: result,
      topics: [],
      outline: { sections: [] },
      points: {}
    });
  } catch (error: any) {
    console.error("智能写作引导API错误:", error);
    return NextResponse.json(
      { error: "生成失败，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
