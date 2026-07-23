import { NextResponse } from "next/server";
import { generateAbstract } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { text, language } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供论文内容" },
        { status: 400 }
      );
    }

    if (text.length > 20000) {
      return NextResponse.json(
        { error: "文本长度不能超过20000字" },
        { status: 400 }
      );
    }

    const result = await generateAbstract(text, language || "zh");

    return NextResponse.json(result);
  } catch (error) {
    console.error("摘要生成API错误:", error);
    return NextResponse.json(
      { error: "摘要生成服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
