import { NextResponse } from "next/server";
import { generateCitation, Paper } from "@/lib/academic/semantic-scholar";

export async function POST(request: Request) {
  try {
    const { papers, format = "gb7714" } = await request.json();

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一篇文献" },
        { status: 400 }
      );
    }

    const citations = papers.map((paper: Paper, index: number) =>
      generateCitation(paper, format, index + 1)
    );

    const fullCitation = citations.join("\n\n");

    return NextResponse.json({
      citations,
      fullCitation,
      format,
      count: citations.length,
    });
  } catch (error: any) {
    console.error("引用生成API错误:", error);
    return NextResponse.json(
      { error: "引用生成失败" },
      { status: 500 }
    );
  }
}
