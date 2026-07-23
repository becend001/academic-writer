import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { title, field, section, projectType } = await request.json();

    if (!title || !section) {
      return NextResponse.json(
        { error: "请提供项目名称和章节" },
        { status: 400 }
      );
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (section) {
      case "abstract":
        systemPrompt = `你是一位资深的学术论文撰写专家。请为以下课题撰写中英文摘要。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}

要求：
1. 包含研究背景、目的、方法、结果、结论
2. 中文摘要200-300字
3. 英文摘要与中文对应
4. 语言简洁、准确

请以JSON格式输出：
{
  "zhAbstract": "中文摘要",
  "enAbstract": "英文摘要"
}`;
        userPrompt = "请撰写中英文摘要";
        break;

      case "background":
        systemPrompt = `你是一位资深的科研项目申报专家。请为以下课题撰写立项依据。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}

要求：
1. 研究意义（500字）：从理论意义和应用价值两方面阐述
2. 国内外研究现状（1000字）：全面、客观，指出当前研究的不足
3. 主要参考文献：列出10-15篇核心文献
4. 语言学术化

请以Markdown格式输出。`;
        userPrompt = "请撰写立项依据";
        break;

      case "content":
        systemPrompt = `你是一位资深的科研项目申报专家。请为以下课题撰写研究内容。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}

要求：
1. 研究目标：具体、可衡量
2. 研究内容：分点列出，逻辑清晰
3. 拟解决的关键问题：列出2-3个
4. 总字数800-1000字

请以Markdown格式输出。`;
        userPrompt = "请撰写研究内容";
        break;

      case "methodology":
        systemPrompt = `你是一位资深的科研项目申报专家。请为以下课题撰写研究方案。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}

要求：
1. 技术路线：可配合流程图描述
2. 实验方案：详细、可操作
3. 可行性分析：从理论、技术、数据、团队等方面分析
4. 总字数1000-1500字

请以Markdown格式输出。`;
        userPrompt = "请撰写研究方案";
        break;

      case "innovation":
        systemPrompt = `你是一位资深的科研项目申报专家。请为以下课题提炼创新点。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}

要求：
1. 列出3-5个创新点
2. 每个创新点说明：
   - 具体描述
   - 与现有研究的区别
   - 学术价值
3. 语言精炼

请以JSON格式输出：
{
  "innovations": [
    {
      "title": "创新点标题",
      "description": "具体描述",
      "difference": "与现有研究的区别",
      "value": "学术价值"
    }
  ]
}`;
        userPrompt = "请提炼创新点";
        break;

      case "budget":
        systemPrompt = `你是一位资深的科研项目申报专家。请为以下课题编制经费预算。

课题信息：
- 题目：${title}
- 领域：${field || "未指定"}
- 类型：${projectType || "国自然"}

要求：
1. 根据项目类型确定总预算
2. 按科目列出预算明细
3. 每个科目说明用途和依据
4. 预算要合理、可执行

请以JSON格式输出：
{
  "totalBudget": 50,
  "unit": "万元",
  "items": [
    {
      "category": "科目名称",
      "amount": 10,
      "description": "用途说明",
      "basis": "计算依据"
    }
  ]
}`;
        userPrompt = "请编制经费预算";
        break;

      default:
        return NextResponse.json(
          { error: "不支持的章节类型" },
          { status: 400 }
        );
    }

    const result = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 2000 }
    );

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json({ content: data, section });
      }
    } catch {
      // JSON解析失败，返回纯文本
    }

    return NextResponse.json({ content: result, section });
  } catch (error: any) {
    console.error("章节内容生成API错误:", error);
    return NextResponse.json(
      { error: "章节内容生成失败" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
