import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";

export const POST = withRateLimit(async (request: Request) => {
  try {
    const { papers, focus, customPrompt } = await request.json();

    if (!papers || !Array.isArray(papers) || papers.length === 0) {
      return NextResponse.json(
        { error: "请提供至少一篇文献" },
        { status: 400 }
      );
    }

    // 构建文献信息
    const papersInfo = papers
      .map(
        (p: any, i: number) =>
          `${i + 1}. ${p.authors?.join(", ") || "Unknown"}. ${p.title}. ${p.journal || ""}, ${p.year}. ${p.abstract ? `摘要：${p.abstract}` : ""}`
      )
      .join("\n\n");

    // 根据focus类型构建不同的prompt
    let systemPrompt = "";
    let userPrompt = "";

    switch (focus) {
      case "status":
        systemPrompt = `你是一位资深的学术论文写作专家，擅长撰写文献综述中的"研究现状"部分。请根据提供的文献，撰写一段关于该领域研究现状的综述。

要求：
1. 概括该领域的研究背景和发展脉络
2. 总结主要的研究方向和成果
3. 指出当前研究的主要贡献
4. 语言学术化、逻辑清晰
5. 字数控制在500-800字`;

        userPrompt = `请根据以下文献，撰写一段关于该领域研究现状的综述：

${papersInfo}

请直接输出综述内容，不需要标题。`;
        break;

      case "method":
        systemPrompt = `你是一位资深的学术论文写作专家，擅长撰写文献综述中的"研究方法"部分。请根据提供的文献，撰写一段关于该领域研究方法的综述。

要求：
1. 总结文献中使用的主要研究方法
2. 分析各种方法的优缺点
3. 比较不同方法的适用场景
4. 语言学术化、逻辑清晰
5. 字数控制在500-800字`;

        userPrompt = `请根据以下文献，撰写一段关于该领域研究方法的综述：

${papersInfo}

请直接输出综述内容，不需要标题。`;
        break;

      case "trend":
        systemPrompt = `你是一位资深的学术论文写作专家，擅长撰写文献综述中的"研究趋势"部分。请根据提供的文献，撰写一段关于该领域研究趋势的综述。

要求：
1. 分析该领域的研究发展趋势
2. 指出未来可能的研究方向
3. 识别当前研究的局限性和空白
4. 提出潜在的研究机会
5. 语言学术化、逻辑清晰
5. 字数控制在500-800字`;

        userPrompt = `请根据以下文献，撰写一段关于该领域研究趋势的综述：

${papersInfo}

请直接输出综述内容，不需要标题。`;
        break;

      case "custom":
        systemPrompt = `你是一位资深的学术论文写作专家，擅长撰写高质量的文献综述。请根据提供的文献和用户的具体要求，撰写文献综述。

要求：
1. 严格围绕用户要求撰写
2. 语言学术化、逻辑清晰
3. 字数控制在500-1000字`;

        userPrompt = `用户要求：${customPrompt || "撰写文献综述"}

请根据以下文献，撰写文献综述：

${papersInfo}

请直接输出综述内容。`;
        break;

      default:
        systemPrompt = `你是一位资深的学术论文写作专家，擅长撰写文献综述。请根据提供的文献，撰写一段综合性的文献综述。

要求：
1. 涵盖研究背景、主要成果和研究趋势
2. 语言学术化、逻辑清晰
3. 字数控制在500-800字`;

        userPrompt = `请根据以下文献，撰写一段文献综述：

${papersInfo}

请直接输出综述内容，不需要标题。`;
    }

    const review = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      { temperature: 0.7, maxTokens: 1500 }
    );

    return NextResponse.json({
      review,
      focus,
      paperCount: papers.length,
    });
  } catch (error: any) {
    console.error("文献综述API错误:", error);
    return NextResponse.json(
      { error: "文献综述生成失败" },
      { status: 500 }
    );
  }
}, { maxRequests: 10, windowMs: 60 * 1000 });
