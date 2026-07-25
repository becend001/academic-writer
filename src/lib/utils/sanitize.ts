/**
 * 输入清洗工具 — 防止 prompt 注入
 * 清理用户输入中的控制字符和潜在的 prompt 操纵内容
 */

// 长度限制
const MAX_INPUT_LENGTH = 50000;

// 可能的 prompt 注入模式（常见攻击模式）
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|rules?)/gi,
  /you\s+are\s+now\s+(a|an|the)/gi,
  /system\s*:\s*/gi,
  /new\s+instructions?\s*:/gi,
  /\[INST\]/gi,
  /<\|im_start\|>/gi,
  /<\|im_end\|>/gi,
  /<\|system\|>/gi,
  /<\|user\|>/gi,
  /<\|assistant\|>/gi,
];

/**
 * 清洗用户输入，用于注入 AI prompt 的场景
 * - 移除控制字符
 * - 截断过长输入
 * - 标记可疑的注入模式（不删除，但添加警告前缀）
 */
export function sanitizeForPrompt(input: string): string {
  if (!input || typeof input !== "string") return "";

  // 截断过长输入
  let cleaned = input.slice(0, MAX_INPUT_LENGTH);

  // 移除零宽字符和控制字符（保留换行和制表符）
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // 移除 Unicode 控制字符（RTL override 等）
  cleaned = cleaned.replace(/[\u200B-\u200F\u2028-\u202F\u2060-\u2069\uFEFF]/g, "");

  return cleaned;
}

/**
 * 检测输入中是否包含 prompt 注入模式
 * 返回检测到的模式描述列表
 */
export function detectInjection(input: string): string[] {
  if (!input || typeof input !== "string") return [];

  const detections: string[] = [];
  for (const pattern of INJECTION_PATTERNS) {
    pattern.lastIndex = 0;
    if (pattern.test(input)) {
      detections.push(pattern.source);
    }
  }
  return detections;
}

/**
 * 安全地将用户输入包装在 prompt 中
 * 使用分隔符和明确的上下文标记来隔离用户输入
 */
export function wrapUserInput(input: string, label: string = "用户输入"): string {
  const cleaned = sanitizeForPrompt(input);
  return `--- ${label}开始 ---\n${cleaned}\n--- ${label}结束 ---`;
}
