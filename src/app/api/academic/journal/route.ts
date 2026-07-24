import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1";

interface JournalInfo {
  name: string;
  publisher: string;
  paperCount: number;
  citationCount: number;
  influenceScore: number;
  quartile: string;
  openAccess: boolean;
  website: string;
}

// 从 Semantic Scholar 获取期刊信息
async function searchJournalsFromSemanticScholar(query: string): Promise<JournalInfo[]> {
  try {
    // 搜索相关论文
    const params = new URLSearchParams({
      query,
      limit: "50",
      fields: "venue,citationCount,year,externalIds",
    });

    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search?${params}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    const papers = data.data || [];

    // 提取期刊信息
    const journalMap = new Map<string, JournalInfo>();

    papers.forEach((paper: any) => {
      const venue = paper.venue;
      if (!venue || venue.length < 3) return;

      if (journalMap.has(venue)) {
        const journal = journalMap.get(venue)!;
        journal.paperCount++;
        journal.citationCount += paper.citationCount || 0;
      } else {
        journalMap.set(venue, {
          name: venue,
          publisher: "",
          paperCount: 1,
          citationCount: paper.citationCount || 0,
          influenceScore: 0,
          quartile: "",
          openAccess: false,
          website: "",
        });
      }
    });

    // 计算影响力分数并排序
    const journals = Array.from(journalMap.values())
      .map((j) => ({
        ...j,
        influenceScore: Math.min(100, Math.round((j.citationCount / j.paperCount) * 2 + j.paperCount * 0.5)),
      }))
      .sort((a, b) => b.influenceScore - a.influenceScore)
      .slice(0, 20);

    return journals;
  } catch (error) {
    console.error("Semantic Scholar 搜索失败:", error);
    return [];
  }
}

// AI 生成期刊推荐
async function generateJournalRecommendations(
  title: string,
  abstract: string,
  keywords: string[],
  field: string,
  targetIF?: number,
  targetQuartile?: string
): Promise<any[]> {
  const systemPrompt = `你是一位资深的学术期刊推荐专家，拥有丰富的论文投稿经验。

请根据用户的论文信息，推荐合适的投稿期刊。

## 期刊信息来源

以下是基于 Semantic Scholar 数据库搜索到的相关期刊信息：
{{JOURNALS}}

## 推荐要求

1. 根据论文的研究领域和内容，推荐最合适的期刊
2. 每个推荐需要包含：
   - 期刊名称（英文全称）
   - 出版社
   - 预估影响因子（基于期刊声誉和领域）
   - 预估分区（Q1/Q2/Q3/Q4）
   - 中科院分区（1区/2区/3区/4区）
   - 预估录用率
   - 预估审稿周期
   - 是否OA（开放获取）
   - 匹配度分数（0-100）
   - 推荐理由（2-3句话）

3. 推荐原则：
   - 优先推荐与研究领域高度匹配的期刊
   - 考虑期刊的影响因子和分区
   - 考虑审稿周期和录用率
   - 如果用户指定了目标IF或分区，优先满足

4. 输出格式（JSON数组）：
[
  {
    "name": "Journal Name",
    "publisher": "Publisher",
    "impactFactor": 5.0,
    "quartile": "Q1",
    "chinesePartition": "1区",
    "acceptanceRate": 25,
    "reviewTime": "3-6个月",
    "openAccess": false,
    "matchScore": 95,
    "matchReason": "推荐理由"
  }
]

请推荐5-10个最合适的期刊。`;

  const journalsText = await searchJournalsFromSemanticScholar(title + " " + abstract)
    .then((journals) => 
      journals.map((j, i) => 
        `${i + 1}. ${j.name} | 论文数: ${j.paperCount} | 引用: ${j.citationCount} | 影响力: ${j.influenceScore}`
      ).join("\n")
    );

  const userPrompt = `请为以下论文推荐投稿期刊：

标题：${title}
摘要：${abstract || "未提供"}
关键词：${keywords.join(", ") || "未提供"}
研究领域：${field || "未指定"}
${targetIF ? `目标影响因子：≥${targetIF}` : ""}
${targetQuartile ? `目标分区：${targetQuartile}` : ""}

请以JSON格式输出推荐结果。`;

  const result = await callDeepSeek(
    [
      { role: "system", content: systemPrompt.replace("{{JOURNALS}}", journalsText || "暂无数据") },
      { role: "user", content: userPrompt },
    ],
    { temperature: 0.3, maxTokens: 2000 }
  );

  // 解析 JSON 结果
  try {
    const jsonMatch = result.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error("JSON 解析失败:", error);
  }

  return [];
}

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { title, abstract, keywords, field, targetIF, targetQuartile } = await request.json();

    if (!title && !abstract) {
      return NextResponse.json(
        { error: "请提供论文标题或摘要" },
        { status: 400 }
      );
    }

    const recommendations = await generateJournalRecommendations(
      title || "",
      abstract || "",
      keywords || [],
      field || "",
      targetIF,
      targetQuartile
    );

    return NextResponse.json({
      success: true,
      recommendations,
      total: recommendations.length,
    });
  } catch (error: any) {
    console.error("期刊推荐API错误:", error);
    return NextResponse.json(
      { error: "期刊推荐服务暂时不可用" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
