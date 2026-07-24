import { NextResponse } from "next/server";
import { extractKeywords } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";
import { MAX_KEYWORDS_TEXT_LENGTH, MAX_KEYWORDS_COUNT } from "@/lib/config";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { text, count } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供需要提取关键词的文本" },
        { status: 400 }
      );
    }

    if (text.length > MAX_KEYWORDS_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `文本长度不能超过${MAX_KEYWORDS_TEXT_LENGTH}字` },
        { status: 400 }
      );
    }

    const validCount = Math.min(Math.max(1, count || 5), MAX_KEYWORDS_COUNT);
    const keywords = await extractKeywords(text, validCount);

    return NextResponse.json({ keywords });
  } catch (error) {
    console.error("关键词提取API错误:", error);
    return NextResponse.json(
      { error: "关键词提取服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
