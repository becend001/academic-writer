import { NextResponse } from "next/server";
import { searchPapers } from "@/lib/academic/semantic-scholar";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { MAX_SEARCH_LIMIT } from "@/lib/config";

export const GET = withRateLimit(async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { error: "请输入搜索关键词" },
        { status: 400 }
      );
    }

    const yearMin = searchParams.get("yearMin")
      ? parseInt(searchParams.get("yearMin")!)
      : undefined;
    const yearMax = searchParams.get("yearMax")
      ? parseInt(searchParams.get("yearMax")!)
      : undefined;
    const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "10")), MAX_SEARCH_LIMIT);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0"));

    const result = await searchPapers(query, {
      yearMin,
      yearMax,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("文献搜索API错误:", error);
    return NextResponse.json(
      { error: "文献搜索服务暂时不可用" },
      { status: 500 }
    );
  }
}, { maxRequests: 20, windowMs: 60 * 1000 });
