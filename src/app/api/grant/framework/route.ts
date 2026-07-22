import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";

export const POST = withRateLimit(async (request: Request) => {
  try {
    const { title, field, projectType } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "请提供项目名称" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一位资深的科研项目申报专家。请为以下课题生成完整的申报书框架。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}
- 类型：${projectType || "国自然"}

要求：
1. 按照${projectType || "国自然"}的标准格式
2. 包含所有必要章节
3. 每个章节给出写作要点和建议字数

请以JSON格式输出：
{
  "framework": {
    "sections": [
      {
        "id": "abstract",
        "title": "摘要",
        "description": "章节说明",
        "wordCount": 500,
        "tips": "写作要点"
      }
    ]
  }
}`;

    const result = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请生成申报书框架" },
      ],
      { temperature: 0.5, maxTokens: 2000 }
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

    return NextResponse.json({
      framework: {
        sections: [
          { id: "abstract", title: "摘要", description: "中英文摘要", wordCount: 500, tips: "包含研究背景、目的、方法、结果、结论" },
          { id: "background", title: "立项依据", description: "研究意义和现状", wordCount: 2000, tips: "从理论和应用两方面阐述" },
          { id: "content", title: "研究内容", description: "具体研究内容", wordCount: 1000, tips: "分点列出，逻辑清晰" },
          { id: "methodology", title: "研究方案", description: "技术路线和方法", wordCount: 1500, tips: "详细、可操作" },
          { id: "innovation", title: "特色与创新", description: "创新点", wordCount: 500, tips: "列出3-5个创新点" },
          { id: "plan", title: "年度计划", description: "研究进度安排", wordCount: 500, tips: "按年度列出任务" },
          { id: "output", title: "预期成果", description: "成果形式", wordCount: 300, tips: "论文、专利等" },
          { id: "budget", title: "经费预算", description: "经费使用计划", wordCount: 500, tips: "按科目列出" },
        ],
      },
    });
  } catch (error: any) {
    console.error("申报书框架API错误:", error);
    return NextResponse.json(
      { error: "申报书框架生成失败" },
      { status: 500 }
    );
  }
}, { maxRequests: 10, windowMs: 60 * 1000 });
