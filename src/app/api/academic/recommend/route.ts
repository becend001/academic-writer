import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { searchPapers } from "@/lib/academic/semantic-scholar";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { content, field, keywords } = await request.json();

    if (!content && !keywords) {
      return NextResponse.json(
        { error: "请提供研究内容或关键词" },
        { status: 400 }
      );
    }

    // 使用AI分析内容，提取搜索关键词
    const analysisPrompt = `你是一位学术文献推荐专家。请根据以下研究内容，提取3-5个最核心的英文搜索关键词，用于在Semantic Scholar上搜索相关文献。

研究内容：
${content || ""}
研究领域：${field || "未指定"}
关键词：${keywords || "未指定"}

请以JSON格式输出：
{
  "searchQueries": ["关键词1", "关键词2", "关键词3"],
  "explanation": "选择这些关键词的原因"
}`;

    const analysisResult = await callDeepSeek([
      { role: "system", content: "你是学术文献推荐专家。" },
      { role: "user", content: analysisPrompt },
    ], { temperature: 0.5 });

    let searchQueries: string[] = [];
    try {
      const jsonMatch = analysisResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        searchQueries = parsed.searchQueries || [];
      }
    } catch {
      // 解析失败，使用原始关键词
      searchQueries = keywords
        ? keywords.split(/[,，、\s]+/)
        : [content?.substring(0, 50) || "research"];
    }

    // 搜索每个关键词
    const allPapers: any[] = [];
    const seenIds = new Set<string>();

    for (const query of searchQueries.slice(0, 3)) {
      try {
        const result = await searchPapers(query, { limit: 5 });
        for (const paper of result.papers) {
          if (!seenIds.has(paper.id)) {
            seenIds.add(paper.id);
            allPapers.push(paper);
          }
        }
      } catch {
        // 搜索失败，继续下一个
      }
    }

    // 使用AI对结果进行排序和推荐
    if (allPapers.length > 0) {
      const papersInfo = allPapers
        .slice(0, 15)
        .map(
          (p, i) =>
            `${i + 1}. ${p.title} (${p.year}) - ${p.journal} - 引用:${p.citationCount}`
        )
        .join("\n");

      const recommendPrompt = `你是一位学术文献推荐专家。请根据以下研究内容，从搜索到的文献中推荐5-8篇最相关的论文。

研究内容：
${content || "学术研究"}

搜索到的文献：
${papersInfo}

请以JSON格式输出推荐结果（按相关度排序）：
{
  "recommendations": [
    {
      "index": 1,
      "reason": "推荐理由（为什么这篇文献与研究内容相关）",
      "relevance": "high/medium"
    }
  ]
}`;

      try {
        const recommendResult = await callDeepSeek([
          { role: "system", content: "你是学术文献推荐专家。" },
          { role: "user", content: recommendPrompt },
        ], { temperature: 0.3 });

        const jsonMatch = recommendResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const recommendations = parsed.recommendations || [];

          // 合并AI推荐结果和原始论文数据
          const enrichedPapers = recommendations
            .map((rec: any) => {
              const paper = allPapers[rec.index - 1];
              if (!paper) return null;
              return {
                ...paper,
                aiReason: rec.reason,
                relevance: rec.relevance,
              };
            })
            .filter(Boolean);

          return NextResponse.json({
            papers: enrichedPapers.length > 0 ? enrichedPapers : allPapers.slice(0, 8),
            searchQueries,
            total: allPapers.length,
          });
        }
      } catch {
        // AI推荐失败，返回原始结果
      }
    }

    return NextResponse.json({
      papers: allPapers.slice(0, 8),
      searchQueries,
      total: allPapers.length,
    });
  } catch (error: any) {
    console.error("AI推荐文献API错误:", error);
    return NextResponse.json(
      { error: "推荐服务暂时不可用" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
