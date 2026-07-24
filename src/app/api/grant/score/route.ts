import { NextResponse } from "next/server";
import { callDeepSeek } from "@/lib/ai/deepseek";
import { withRateLimit } from "@/lib/middleware/api-guard";
import { withUsageLimit } from "@/lib/middleware/usage-guard";

const SCORING_PROMPT = `你是一位资深的基金评审专家，拥有20年评审经验，曾评审过数千份国家自然科学基金、国家社科基金等各类课题申报书。

请对以下课题申报书进行专业评分和评估。

## 评分维度（总分100分）

1. **选题创新性（25分）**
   - 原创性：是否有新的科学问题或技术方法（0-10分）
   - 前沿性：是否紧跟国际前沿（0-8分）
   - 研究价值：是否具有理论或应用价值（0-7分）

2. **研究方案可行性（25分）**
   - 技术路线：是否清晰、合理（0-10分）
   - 研究方法：是否科学、先进（0-8分）
   - 风险控制：是否有备选方案（0-7分）

3. **文献综述质量（20分）**
   - 全面性：是否覆盖主要文献（0-8分）
   - 时效性：是否引用最新文献（0-7分）
   - 批判性：是否有自己的分析和见解（0-5分）

4. **预期成果明确性（15分）**
   - 可量化：成果是否具体、可衡量（0-6分）
   - 创新性：成果是否有创新点（0-5分）
   - 可考核：是否可验收（0-4分）

5. **经费预算合理性（15分）**
   - 分配合理性：各项费用比例是否合理（0-6分）
   - 资助强度：是否符合该类项目资助范围（0-5分）
   - 使用依据：是否有充分的说明（0-4分）

## 申报书内容

标题：{{TITLE}}
研究领域：{{FIELD}}
项目类型：{{PROJECT_TYPE}}

### 摘要
{{ABSTRACT}}

### 立项依据
{{BACKGROUND}}

### 研究内容
{{CONTENT}}

### 研究方案
{{METHODOLOGY}}

### 特色与创新
{{INNOVATION}}

### 年度计划
{{PLAN}}

### 预期成果
{{OUTPUT}}

### 经费预算
{{BUDGET}}

## 输出要求

请严格按以下JSON格式输出评分结果，不要包含其他内容：

{
  "totalScore": 总分(0-100的整数),
  "level": "优秀(≥85) / 良好(70-84) / 合格(60-69) / 需改进(<60)",
  "dimensions": {
    "innovation": 创新性得分(0-25),
    "feasibility": 可行性得分(0-25),
    "literature": 文献质量得分(0-20),
    "output": 成果明确性得分(0-15),
    "budget": 预算合理性得分(0-15)
  },
  "strengths": ["优势1", "优势2", "优势3"],
  "weaknesses": ["不足1", "不足2", "不足3"],
  "suggestions": ["改进建议1", "改进建议2", "改进建议3", "改进建议4", "改进建议5"]
}

注意：
1. 评分要客观、公正，不要过于宽松或过于苛刻
2. 改进建议要具体、可操作
3. 优势和不足各列3条，改进建议列5条
4. 如果某个章节为空或内容很少，该项得分应较低`;

export const POST = withRateLimit(withUsageLimit(async (request: Request) => {
  try {
    const { title, field, projectType, sections } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "请提供项目名称" },
        { status: 400 }
      );
    }

    if (!sections || Object.keys(sections).length === 0) {
      return NextResponse.json(
        { error: "请先生成申报书内容" },
        { status: 400 }
      );
    }

    // 构建完整的 prompt
    const systemPrompt = SCORING_PROMPT
      .replace("{{TITLE}}", title)
      .replace("{{FIELD}}", field || "未指定")
      .replace("{{PROJECT_TYPE}}", projectType || "未指定")
      .replace("{{ABSTRACT}}", sections.abstract || "（未填写）")
      .replace("{{BACKGROUND}}", sections.background || "（未填写）")
      .replace("{{CONTENT}}", sections.content || "（未填写）")
      .replace("{{METHODOLOGY}}", sections.methodology || "（未填写）")
      .replace("{{INNOVATION}}", sections.innovation || "（未填写）")
      .replace("{{PLAN}}", sections.plan || "（未填写）")
      .replace("{{OUTPUT}}", sections.output || "（未填写）")
      .replace("{{BUDGET}}", sections.budget || "（未填写）");

    const result = await callDeepSeek(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "请对以上课题申报书进行评分" },
      ],
      { temperature: 0.3, maxTokens: 1500 }
    );

    // 解析 JSON 结果
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const scoreData = JSON.parse(jsonMatch[0]);
        
        // 验证数据结构
        if (scoreData.totalScore !== undefined && scoreData.dimensions) {
          // 确保分数在合理范围内
          scoreData.totalScore = Math.min(100, Math.max(0, scoreData.totalScore));
          
          // 确保各维度分数在范围内
          const dims = scoreData.dimensions;
          dims.innovation = Math.min(25, Math.max(0, dims.innovation || 0));
          dims.feasibility = Math.min(25, Math.max(0, dims.feasibility || 0));
          dims.literature = Math.min(20, Math.max(0, dims.literature || 0));
          dims.output = Math.min(15, Math.max(0, dims.output || 0));
          dims.budget = Math.min(15, Math.max(0, dims.budget || 0));

          return NextResponse.json({
            success: true,
            score: scoreData,
          });
        }
      }
    } catch (parseError) {
      console.error("评分结果解析失败:", parseError);
    }

    // JSON 解析失败，返回错误
    return NextResponse.json(
      { error: "评分生成失败，请重试" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("评分API错误:", error);
    return NextResponse.json(
      { error: "评分服务暂时不可用" },
      { status: 500 }
    );
  }
}), { maxRequests: 5, windowMs: 60 * 1000 });
