import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

const COVER_LETTER_PROMPT = `你是一位资深的学术论文投稿专家，拥有丰富的国际期刊投稿经验。

请根据用户提供的论文信息和目标期刊，撰写一封专业的投稿信（Cover Letter）。

## 投稿信结构

1. **开头**：说明投稿意向
2. **研究背景**：简要介绍研究领域和背景
3. **研究目的**：说明研究要解决的问题
4. **主要发现**：概述最重要的研究成果
5. **创新点**：强调论文的创新之处
6. **期刊匹配**：说明为什么选择该期刊
7. **确认声明**：确认未一稿多投等
8. **审稿人建议**：建议2-3位潜在审稿人
9. **结尾**：感谢编辑

## 写作要求

1. 语言专业、简洁、正式
2. 篇幅控制在300-500词
3. 突出论文的创新性和重要性
4. 与目标期刊的范围匹配
5. 使用第一人称复数（We）

## 输出格式

请直接输出投稿信正文，不要包含标题或额外说明。使用以下占位符（如果有信息）：
- [AUTHOR_NAME]：通讯作者姓名
- [AFFILIATION]：单位名称
- [EMAIL]：联系邮箱

如果信息不足，请用合理的占位符或通用表达。`;

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { title, abstract, keywords, field, journalName, authorName, affiliation, email } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "请提供论文标题" },
        { status: 400 }
      );
    }

    const userPrompt = `请为以下论文撰写投稿信：

## 论文信息
标题：${title}
摘要：${abstract || "未提供"}
关键词：${keywords?.join(", ") || "未提供"}
研究领域：${field || "未指定"}

## 投稿信息
目标期刊：${journalName || "未指定"}
通讯作者：${authorName || "[AUTHOR_NAME]"}
单位：${affiliation || "[AFFILIATION]"}
邮箱：${email || "[EMAIL]"}

请撰写专业的投稿信。`;

    const result = await callDeepSeek(
      [
        { role: "system", content: COVER_LETTER_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5, maxTokens: 1500 }
    );

    return NextResponse.json({
      success: true,
      coverLetter: result,
    });
  } catch (error: any) {
    console.error("投稿信生成API错误:", error);
    return NextResponse.json(
      { error: "投稿信生成服务暂时不可用" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
