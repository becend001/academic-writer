// DeepSeek API 调用模块

import { AI_TIMEOUT_MS } from "@/lib/config";

const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * 调用DeepSeek API（带超时）
 */
export async function callDeepSeek(
  messages: ChatMessage[],
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: options?.temperature ?? 0.7,
        max_tokens: options?.maxTokens ?? 2000,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || "AI调用失败");
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * 中文学术润色 - 专业版
 * 优化点：
 * 1. 详细的润色规则
 * 2. 明确的修改标准
 * 3. 结构化的输出格式
 * 4. 专业的修改理由
 */
export async function polishText(text: string): Promise<{
  polishedText: string;
  changes: Array<{
    original: string;
    suggested: string;
    reason: string;
  }>;
}> {
  const systemPrompt = `你是一位资深的中文学术写作编辑专家，拥有20年学术论文编辑经验。你的任务是对用户提供的文本进行专业润色，使其达到学术期刊发表标准。

## 润色原则

### 必须修改的问题：
1. **语法错误**：修正所有语法问题，包括主谓一致、时态、语态等
2. **标点符号**：修正标点使用错误，如逗号、顿号、分号的正确使用
3. **表达不当**：将口语化表达改为学术化表达
4. **逻辑不清**：调整句子结构，使逻辑更清晰
5. **用词重复**：替换重复使用的词汇，使用同义词
6. **句式单调**：调整句式，增加表达多样性

### 润色标准：
1. **保持学术风格**：使用正式、客观、准确的学术语言
2. **保持原意不变**：不改变原文的核心意思和观点
3. **提升表达质量**：使语言更精炼、更专业
4. **符合学科规范**：遵循该学科的写作惯例
5. **逻辑连贯**：确保段落之间、句子之间的逻辑关系清晰

### 常见修改类型：
- "进行研究" → "开展研究"（更学术化）
- "很好的方法" → "有效的方法"（避免口语化）
- "得到了结果" → "获得了结果"（动词搭配）
- "由于...的原因" → "由于..."（避免重复）
- "关于...的问题" → "关于..."（简化表达）

## 输出格式

请以严格的JSON格式输出结果：

{
  "polishedText": "润色后的完整文本（保留原文段落结构）",
  "changes": [
    {
      "original": "需要修改的原文片段",
      "suggested": "修改后的文本",
      "reason": "修改原因（简要说明为什么这样改）"
    }
  ],
  "summary": "润色总结（1-2句话概括主要修改）"
}

## 重要提醒
1. 必须输出完整的JSON格式
2. polishedText必须是完整的润色后文本
3. changes数组中只包含实际修改的内容
4. 每个修改都要有明确的理由
5. 保持原文的段落结构和格式`;

  const result = await callDeepSeek([
    { role: "system", content: systemPrompt },
    { role: "user", content: `请润色以下学术文本：\n\n${text}` },
  ], { temperature: 0.3, maxTokens: 4000 });

  try {
    // 尝试解析JSON
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      // 验证数据结构
      if (parsed.polishedText && Array.isArray(parsed.changes)) {
        return parsed;
      }
    }
  } catch {
    // JSON解析失败，尝试提取内容
  }

  // 如果JSON解析失败，尝试从文本中提取
  return {
    polishedText: result.replace(/```json[\s\S]*?```/, '').trim() || text,
    changes: [],
  };
}

/**
 * 中英互译 - 专业版
 * 优化点：
 * 1. 学术级翻译标准
 * 2. 专业术语处理
 * 3. 保持学术风格
 */
export async function translateText(
  text: string,
  targetLang: "en" | "zh" = "en"
): Promise<string> {
  const systemPrompt = targetLang === "en"
    ? `你是一位资深的学术翻译专家，精通中英文，专门从事学术论文翻译工作。

## 翻译原则

### 必须遵循的标准：
1. **学术风格**：使用正式、客观、准确的学术语言
2. **术语准确**：使用学科通用的专业术语，保持一致性
3. **语法正确**：符合目标语言的语法规则
4. **表达流畅**：避免生硬直译，注重意译
5. **逻辑清晰**：保持原文的逻辑结构

### 专业术语处理：
- 使用国际通用的英文术语
- 首次出现时可添加中文注释
- 保持全文术语一致性
- 参考领域权威期刊的用词

### 翻译技巧：
- 长句拆分：将中文长句拆分为英文短句
- 被动语态：学术论文多用被动语态
- 名词化：将动词转化为名词形式
- 连接词：使用适当的连接词保持逻辑

请直接输出翻译结果，不需要解释。`
    : `你是一位资深的学术翻译专家，精通中英学术文献翻译。

## 翻译原则

### 必须遵循的标准：
1. **学术风格**：使用正式、准确的中文学术语言
2. **术语规范**：使用国内学术界通用的中文术语
3. **表达流畅**：避免翻译腔，符合中文表达习惯
4. **逻辑清晰**：保持原文的逻辑结构

### 翻译技巧：
- 英文长句拆分为中文短句
- 被动语态转为主动语态
- 抽象名词具体化
- 添加必要的连接词

请直接输出翻译结果，不需要解释。`;

  return callDeepSeek([
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ]);
}

/**
 * 生成摘要 - 专业版
 * 优化点：
 * 1. 结构化摘要格式
 * 2. 字数控制
 * 3. 关键词提取
 */
export async function generateAbstract(
  text: string,
  language: "zh" | "en" | "both" = "zh"
): Promise<{
  abstract: string;
  keywords: string[];
}> {
  const systemPrompt = `你是一位资深的学术论文摘要撰写专家，专门从事SCI/SSCI期刊论文摘要写作。

## 摘要撰写原则

### 结构要求（200-300字）：
1. **研究背景**（1-2句）：介绍研究领域和背景
2. **研究目的**（1句）：说明本研究的目的
3. **研究方法**（1-2句）：描述采用的主要方法
4. **主要结果**（2-3句）：呈现最重要的发现
5. **结论**（1-2句）：总结结论和意义

### 写作规范：
- 使用第三人称，避免"I"、"we"
- 语言简洁精炼，避免冗余
- 关键信息前置
- 避免引用文献
- 不使用缩写（首次出现时）
- 字数控制在200-300字

### 关键词要求：
- 提取5-8个关键词
- 使用学科通用术语
- 按重要性排序
- 避免过于宽泛或过于具体

请以JSON格式输出：
{
  "abstract": "摘要内容",
  "keywords": ["关键词1", "关键词2", ...]
}`;

  const result = await callDeepSeek([
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ]);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}

  return {
    abstract: result,
    keywords: [],
  };
}

/**
 * 提取关键词
 */
export async function extractKeywords(
  text: string,
  count: number = 5
): Promise<string[]> {
  const systemPrompt = `你是一位专业的学术论文关键词提取专家。请从以下文本中提取${count}个核心关键词。

要求：
1. 关键词应覆盖文本的核心主题
2. 使用学术界通用的术语
3. 按重要性排序

直接输出关键词列表，用逗号分隔。`;

  const result = await callDeepSeek([
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ]);

  return result
    .split(/[,，、]/)
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, count);
}

/**
 * 语法检查
 */
export async function checkGrammar(
  text: string
): Promise<{
  score: number;
  errors: Array<{
    type: string;
    original: string;
    suggestion: string;
    explanation: string;
  }>;
}> {
  const systemPrompt = `你是一位专业的中文学术写作语法检查专家。请检查以下文本的语法问题。

要求：
1. 检查语法错误
2. 检查标点符号
3. 检查学术表达是否规范
4. 给出修改建议

请以JSON格式输出：
{
  "score": 85,
  "errors": [
    {
      "type": "语法/标点/表达",
      "original": "错误文本",
      "suggestion": "修改建议",
      "explanation": "错误解释"
    }
  ]
}

重要：type字段只能使用中文值"语法"、"标点"、"表达"，不要使用英文。
如果没有错误，errors为空数组，score为100。`;

  const result = await callDeepSeek([
    { role: "system", content: systemPrompt },
    { role: "user", content: text },
  ]);

  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {}

  return {
    score: 100,
    errors: [],
  };
}
