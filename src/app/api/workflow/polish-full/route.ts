import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: "请提供文本内容" },
        { status: 400 }
      );
    }

    // 步骤1：润色
    const polishResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的中文学术写作编辑专家。请润色以下文本，要求：
1. 保持学术风格和专业性
2. 修正语法错误和标点符号
3. 将口语化表达改为学术化表达
4. 保持原文核心意思不变
5. 提升表达的准确性和流畅性

请以JSON格式输出：
{
  "polishedText": "润色后的完整文本",
  "changes": [{"original": "原文", "suggested": "修改后", "reason": "原因"}]
}`,
        },
        { role: "user", content: text },
      ],
      { temperature: 0.3, maxTokens: 3000 }
    );

    let polishedText = text;
    try {
      const jsonMatch = polishResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        polishedText = parsed.polishedText || text;
      }
    } catch {
      polishedText = polishResult;
    }

    // 步骤2：翻译
    const translateResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的学术翻译专家，精通中英文，专门从事学术论文翻译工作。

翻译要求：
1. 将中文学术文本翻译为地道的英文学术英语
2. 使用国际通用的英文术语
3. 符合SCI/SSCI期刊的英文写作风格
4. 保持原文的逻辑结构和学术严谨性
5. 长句适当拆分，使用被动语态和名词化表达

请直接输出英文翻译结果，不需要解释。`,
        },
        { role: "user", content: polishedText },
      ],
      { temperature: 0.3, maxTokens: 3000 }
    );

    // 步骤3：摘要
    const abstractResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的学术论文摘要撰写专家。请根据以下论文内容生成摘要。

摘要结构（200-300字）：
1. 研究背景（1-2句）
2. 研究目的（1句）
3. 研究方法（1-2句）
4. 主要结果（2-3句）
5. 结论（1-2句）

同时提取5-8个关键词。

请以JSON格式输出：
{
  "abstract": "摘要内容",
  "keywords": ["关键词1", "关键词2", ...]
}`,
        },
        { role: "user", content: text },
      ],
      { temperature: 0.3, maxTokens: 1000 }
    );

    let abstract = "";
    let keywords: string[] = [];
    try {
      const jsonMatch = abstractResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        abstract = parsed.abstract || "";
        keywords = parsed.keywords || [];
      }
    } catch {
      abstract = abstractResult;
    }

    // 返回完整结果
    return NextResponse.json({
      polish: {
        text: polishedText,
        original: text,
      },
      translate: {
        text: translateResult,
      },
      abstract: {
        text: abstract,
        keywords: keywords,
      },
      summary: {
        originalLength: text.length,
        polishedLength: polishedText.length,
        keywordsCount: keywords.length,
      },
    });
  } catch (error: any) {
    console.error("工作流执行错误:", error);
    return NextResponse.json(
      { error: "处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
