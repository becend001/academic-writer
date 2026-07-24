import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

const REBUTTAL_PROMPT = `你是一位资深的学术论文修改回复专家，拥有丰富的论文修回经验。

请根据审稿人意见和作者的原始论文内容，撰写专业的回复信（Response to Reviewers）。

## 回复信结构

1. **开头**：感谢编辑和审稿人的宝贵意见
2. **总体回复**：对整体评审意见的回应
3. **逐条回复**：对每个审稿人意见的详细回复
4. **修改说明**：在稿件中标注的修改
5. **结尾**：再次感谢，表示愿意进一步修改

## 回复原则

1. **礼貌专业**：始终保持尊重和专业的语气
2. **有理有据**：每个回复都要有充分的理由或证据
3. **具体明确**：指出具体修改位置和内容
4. **接受合理意见**：对合理的批评要诚恳接受
5. **反驳无理意见**：对不合理的意见要礼貌但坚定地反驳

## 回复格式

对每条意见，使用以下格式：

**Reviewer #1, Comment #1:**
[原文意见]

**Response:**
[回复内容]

**修改位置：** [具体位置，如"第X页第Y段"]

## 输出要求

1. 语言专业、礼貌
2. 逐条回复，不遗漏
3. 对于接受的意见，说明修改内容
4. 对于不接受的意见，给出充分理由
5. 控制总字数在1000-2000词`;

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { title, reviewerComments, originalContent, authorResponses } = await request.json();

    if (!reviewerComments) {
      return NextResponse.json(
        { error: "请提供审稿人意见" },
        { status: 400 }
      );
    }

    const userPrompt = `请为以下论文撰写审稿意见回复：

## 论文信息
标题：${title || "未提供"}

## 原始内容（摘要/关键段落）
${originalContent || "未提供"}

## 审稿人意见
${reviewerComments}

## 作者初步回复（可选）
${authorResponses || "无"}

请撰写专业的回复信。`;

    const result = await callDeepSeek(
      [
        { role: "system", content: REBUTTAL_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.5, maxTokens: 3000 }
    );

    // 尝试解析结构化的回复
    const responses: { original: string; response: string; location?: string }[] = [];
    const sections = result.split(/Reviewer\s+#\d+/i).filter(Boolean);

    for (const section of sections) {
      if (section.trim()) {
        const originalMatch = section.match(/(?:Comment|意见)[：:]\s*([\s\S]*?)(?:Response|回复)/i);
        const responseMatch = section.match(/(?:Response|回复)[：:]\s*([\s\S]*?)(?:Reviewer|修改位置|$)/i);
        const locationMatch = section.match(/(?:修改位置|Location)[：:]\s*(.*)/i);

        if (originalMatch || responseMatch) {
          responses.push({
            original: originalMatch?.[1]?.trim() || "",
            response: responseMatch?.[1]?.trim() || section,
            location: locationMatch?.[1]?.trim(),
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      rebuttal: result,
      structured: responses.length > 0 ? responses : undefined,
    });
  } catch (error: any) {
    console.error("审稿回复生成API错误:", error);
    return NextResponse.json(
      { error: "审稿回复生成服务暂时不可用" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
