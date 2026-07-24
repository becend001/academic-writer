import { NextResponse } from "next/server";
import { polishText } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";
import { MAX_TEXT_LENGTH } from "@/lib/config";

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "请提供需要润色的文本" },
        { status: 400 }
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return NextResponse.json(
        { error: `文本长度不能超过${MAX_TEXT_LENGTH}字` },
        { status: 400 }
      );
    }

    const result = await polishText(text);

    return NextResponse.json(result);
  } catch (error) {
    console.error("润色API错误:", error);
    return NextResponse.json(
      { error: "润色服务暂时不可用，请稍后重试" },
      { status: 500 }
    );
  }
}), { maxRequests: 10, windowMs: 60 * 1000 });
