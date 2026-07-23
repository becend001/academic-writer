import { NextResponse } from "next/server";
import { extractKeywords } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { text, count } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供需要提取关键词的文本" },
        { status: 400 }
      );
    }

    if (text.length > 20000) {
      return NextResponse.json(
        { error: "文本长度不能超过20000字" },
        { status: 400 }
      );
    }

    const keywords = await extractKeywords(text, count || 5);

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("关键词提取API错误:", error);
    return NextResponse.json(
      { error: "关键词提取服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
