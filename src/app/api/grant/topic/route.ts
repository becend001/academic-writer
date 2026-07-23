import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { field, keywords, projectType } = await request.json();

    if (!field && !keywords) {
      return NextResponse.json(
        { error: "请提供研究领域或关键词" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一位资深的科研项目评审专家。请根据用户提供的研究领域和关键词，推荐3-5个适合申报${projectType || "国自然"}课题的选题。

要求：
1. 选题要具有创新性和前沿性
2. 考虑当前的研究热点
3. 评估选题的可行性
4. 给出预期成果

每个选题需要包含：
- 项目名称
- 研究意义
- 创新点
- 可行性分析
- 预期成果

请以JSON格式输出：
{
  "suggestions": [
    {
      "title": "项目名称",
      "significance": "研究意义",
      "innovation": "创新点",
      "feasibility": "可行性分析",
      "expectedOutput": "预期成果"
    }
  ]
}`;

    const result = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `研究领域：${field || "未指定"}\n关键词：${keywords || "未指定"}`,
        },
      ],
      { temperature: 0.7, maxTokens: 2000 }
    );

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json(data);
      }
    } catch {
      // JSON解析失败
    }

    return NextResponse.json({ suggestions: [] });
  } catch (error: any) {
    console.error("选题建议API错误:", error);
    return NextResponse.json(
      { error: "选题建议生成失败" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
