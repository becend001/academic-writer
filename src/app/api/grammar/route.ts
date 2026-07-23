import { NextResponse } from "next/server";
import { checkGrammar } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供需要检查语法的文本" },
        { status: 400 }
      );
    }

    if (text.length > 5000) {
      return NextResponse.json(
        { error: "文本长度不能超过5000字" },
        { status: 400 }
      );
    }

    const result = await checkGrammar(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("语法检查API错误:", error);
    return NextResponse.json(
      { error: "语法检查服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
