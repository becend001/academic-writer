import { NextResponse } from "next/server";
import { generateCitation, Paper } from "@/lib/academic/semantic-scholar";
import { withRateLimit } from "@/lib/middleware/api-guard";

export const POST = withRateLimit(async (request: Request) => {
  try {
    const { papers, format = "gb7714" } = await request.json();

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一篇文献" },
        { status: 400 }
      );
    }

    if (papers.length > 20) {
      return NextResponse.json(
        { error: "最多支持20篇文献" },
        { status: 400 }
      );
    }

    const citations = papers.map((paper: Paper) => generateCitation(paper, format as any));

    return NextResponse.json({ citations });
  } catch (error: any) {
    console.error("引用生成API错误:", error);
    return NextResponse.json(
      { error: "引用生成失败" },
      { status: 500 }
    );
  }
}, { maxRequests: 20, windowMs: 60 * 1000 });
