// Semantic Scholar API 调用模块

import { SEARCH_TIMEOUT_MS } from "@/lib/config";

const SEMANTIC_SCHOLAR_API = "https://api.semanticscholar.org/graph/v1";

export interface Paper {
  id: string;
  title: string;
  authors: string[];
  year: number;
  journal: string;
  citationCount: number;
  abstract: string;
  doi: string;
  url: string;
}

/**
 * 搜索文献
 */
export async function searchPapers(
  query: string,
  options?: {
    yearMin?: number;
    yearMax?: number;
    limit?: number;
    offset?: number;
  }
): Promise<{ papers: Paper[]; total: number }> {
  const params = new URLSearchParams({
    query,
    limit: String(options?.limit || 10),
    offset: String(options?.offset || 0),
    fields: "title,authors,year,venue,citationCount,abstract,externalIds,url",
  });

  if (options?.yearMin || options?.yearMax) {
    const yearRange = [
      options?.yearMin || "",
      options?.yearMax || "",
    ].join("-");
    params.append("year", yearRange);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_API}/paper/search?${params}`,
      { signal: controller.signal }
    );

    if (!response.ok) {
      throw new Error("文献搜索失败");
    }

    const data = await response.json();

    const papers: Paper[] = (data.data || []).map((paper: any) => ({
      id: paper.paperId,
      title: paper.title,
      authors: (paper.authors || []).map((a: any) => a.name),
      year: paper.year,
      journal: paper.venue || "",
      citationCount: paper.citationCount || 0,
      abstract: paper.abstract || "",
      doi: paper.externalIds?.DOI || "",
      url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
    }));

    return {
      papers,
      total: data.total || 0,
    };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 根据内容获取推荐文献
 */
export async function getRecommendations(
  paperId: string,
  limit: number = 5
): Promise<Paper[]> {
  const response = await fetch(
    `${SEMANTIC_SCHOLAR_API}/paper/${paperId}/recommendations?limit=${limit}&fields=title,authors,year,venue,citationCount,abstract,externalIds,url`
  );

  if (!response.ok) {
    throw new Error("获取推荐文献失败");
  }

  const data = await response.json();

  return (data.recommendedPapers || []).map((paper: any) => ({
    id: paper.paperId,
    title: paper.title,
    authors: (paper.authors || []).map((a: any) => a.name),
    year: paper.year,
    journal: paper.venue || "",
    citationCount: paper.citationCount || 0,
    abstract: paper.abstract || "",
    doi: paper.externalIds?.DOI || "",
    url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
  }));
}

/**
 * 生成引用格式
 */
export function generateCitation(paper: Paper, format: string = "gb7714", index?: number): string {
  const authors = paper.authors.join(", ");
  const year = paper.year || "n.d.";
  const prefix = index !== undefined ? `[${index}] ` : "";

  switch (format) {
    case "gb7714":
      return `${prefix}${authors}. ${paper.title}[J]. ${paper.journal}, ${year}.`;
    case "apa":
      return `${authors} (${year}). ${paper.title}. ${paper.journal}.`;
    case "mla":
      return `${authors}. "${paper.title}." ${paper.journal}, ${year}.`;
    case "chicago":
      return `${authors}. "${paper.title}." ${paper.journal} (${year}).`;
    case "ieee":
      return `${prefix}${authors}, "${paper.title}," ${paper.journal}, ${year}.`;
    case "harvard":
      return `${authors} (${year}) '${paper.title}', ${paper.journal}.`;
    default:
      return `${prefix}${authors}. ${paper.title}. ${paper.journal}, ${year}.`;
  }
}
