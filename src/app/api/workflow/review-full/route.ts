import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { searchPapers, Paper } from "@/lib/academic/semantic-scholar";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { topic, field } = await request.json();

    if (!topic) {
      return NextResponse.json(
        { error: "请提供研究主题" },
        { status: 400 }
      );
    }

    // 步骤1：生成搜索关键词
    const keywordsResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位学术文献检索专家。请根据研究主题，生成3个用于搜索相关文献的英文关键词。

研究主题：${topic}
研究领域：${field || "未指定"}

请以JSON格式输出：
{
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`,
        },
        { role: "user", content: "请生成搜索关键词" },
      ],
      { temperature: 0.5, maxTokens: 300 }
    );

    let keywords: string[] = [];
    try {
      const jsonMatch = keywordsResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        keywords = JSON.parse(jsonMatch[0]).keywords || [topic];
      }
    } catch {
      keywords = [topic];
    }

    // 步骤2：搜索真实文献
    let allPapers: Paper[] = [];
    for (const keyword of keywords.slice(0, 3)) {
      try {
        const result = await searchPapers(keyword, { limit: 5 });
        allPapers = [...allPapers, ...result.papers];
      } catch {
        // 搜索失败，继续下一个关键词
      }
    }

    // 去重
    const uniquePapers = allPapers.filter(
      (paper, index, self) => index === self.findIndex((p) => p.id === paper.id)
    );

    // 步骤3：基于真实文献生成综述框架
    const papersSummary = uniquePapers
      .slice(0, 10)
      .map(
        (p, i) =>
          `${i + 1}. ${p.title} (${p.year}) - ${p.journal} - 引用:${p.citationCount}`
      )
      .join("\n");

    const frameworkResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的学术文献综述专家。请根据以下研究主题和搜索到的文献，生成文献综述的写作框架。

研究主题：${topic}
研究领域：${field || "未指定"}

搜索到的文献：
${papersSummary}

请生成文献综述框架，包含：
1. 引言（研究背景、综述目的、综述范围）
2. 主体部分（按主题分类，每个子主题包含核心文献）
3. 研究空白（现有不足、未来方向）
4. 结论（主要发现、研究意义）

请以JSON格式输出框架结构。`,
        },
        { role: "user", content: "请生成文献综述框架" },
      ],
      { temperature: 0.5, maxTokens: 1500 }
    );

    let framework: any = { sections: [] };
    try {
      const jsonMatch = frameworkResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        framework = JSON.parse(jsonMatch[0]);
      }
    } catch {
      framework = {
        sections: [
          { title: "一、引言", subsections: ["研究背景", "综述目的", "综述范围"] },
          { title: "二、主体部分", subsections: ["按主题分类", "核心文献", "研究进展"] },
          { title: "三、研究空白", subsections: ["现有不足", "未来方向"] },
          { title: "四、结论", subsections: ["主要发现", "研究意义"] },
        ],
      };
    }

    // 步骤4：生成各部分写作要点
    const pointsResult = await callDeepSeek(
      [
        {
          role: "system",
          content: `你是一位资深的学术文献综述专家。请为文献综述的各部分生成写作要点。

研究主题：${topic}
搜索到的文献数量：${uniquePapers.length}篇

请为以下部分生成写作要点：
1. 引言（研究背景、综述目的、综述范围）
2. 主体部分（按主题分类的核心文献）
3. 研究空白（现有不足、未来方向）
4. 结论（主要发现、研究意义）

每个部分需要包含：
- 需要包含的要点（3-5个）
- 每个要点的简要说明
- 建议字数

请以JSON格式输出：
{
  "points": {
    "introduction": {
      "title": "引言",
      "items": [{"point": "要点", "description": "说明"}],
      "suggestedWords": 500
    }
  }
}`,
        },
        { role: "user", content: "请生成各部分写作要点" },
      ],
      { temperature: 0.5, maxTokens: 1500 }
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
      keywords,
      papers: uniquePapers.slice(0, 10),
      framework,
      points,
    });
  } catch (error: any) {
    console.error("文献综述工作流错误:", error);
    return NextResponse.json(
      { error: "处理失败，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
