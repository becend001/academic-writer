import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

const FORMAT_CHECK_PROMPT = `你是一位资深的学术论文格式审查专家。

请检查用户提供的论文内容是否符合学术写作规范。

## 检查维度

1. **标题**
   - 是否简洁明了（建议10-15词）
   - 是否包含关键词
   - 是否避免缩写

2. **摘要**
   - 字数是否符合要求（150-300词）
   - 是否包含背景、目的、方法、结果、结论
   - 是否独立成段

3. **关键词**
   - 数量是否合适（3-8个）
   - 是否按字母顺序排列（英文）
   - 是否避免与标题重复

4. **正文结构**
   - 是否有清晰的逻辑结构
   - 段落是否过长（建议每段不超过200词）
   - 是否有过渡句

5. **语言表达**
   - 语法是否正确
   - 用词是否准确
   - 是否有重复表达

6. **参考文献**
   - 格式是否统一
   - 引用是否规范
   - 是否有遗漏

## 输出格式

请以JSON格式输出检查结果：

{
  "score": 85,
  "level": "良好",
  "issues": [
    {
      "type": "error",
      "category": "标题",
      "description": "标题过长，建议精简",
      "suggestion": "将标题控制在15词以内"
    },
    {
      "type": "warning",
      "category": "摘要",
      "description": "摘要缺少研究结果部分",
      "suggestion": "补充主要研究发现"
    }
  ],
  "summary": "整体格式良好，有2处需要修改，3处建议优化"
}

问题类型：
- error：必须修改
- warning：建议修改
- info：仅供参考`;

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { title, abstract, keywords, content, journalName } = await request.json();

    if (!content && !title && !abstract) {
      return NextResponse.json(
        { error: "请提供论文内容" },
        { status: 400 }
      );
    }

    const userPrompt = `请检查以下论文内容的格式规范：

## 论文标题
${title || "未提供"}

## 摘要
${abstract || "未提供"}

## 关键词
${keywords?.join(", ") || "未提供"}

## 正文内容
${content || "未提供"}

## 目标期刊
${journalName || "未指定"}

请进行格式检查并输出结果。`;

    const result = await callDeepSeek(
      [
        { role: "system", content: FORMAT_CHECK_PROMPT },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    );

    // 解析 JSON 结果
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return NextResponse.json({
          success: true,
          ...data,
        });
      }
    } catch (parseError) {
      console.error("JSON 解析失败:", parseError);
    }

    // JSON 解析失败，返回纯文本
    return NextResponse.json({
      success: true,
      score: 70,
      level: "未知",
      issues: [],
      summary: result,
    });
  } catch (error: any) {
    console.error("格式检查API错误:", error);
    return NextResponse.json(
      { error: "格式检查服务暂时不可用" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
