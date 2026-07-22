import { NextResponse } from "next/server";
import { searchPapers } from "@/lib/academic/semantic-scholar";

export async function GET(request: Request) {
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
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : 10;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : 0;

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
}
