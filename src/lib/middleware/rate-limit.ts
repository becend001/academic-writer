// 简单的内存限流器（适合单实例部署）
// 生产环境建议使用 Redis

const requestCounts = new Map<string, { count: number; resetTime: number }>();

// 最大条目数，防止内存无限增长
const MAX_ENTRIES = 10000;

interface RateLimitConfig {
  maxRequests: number;     // 时间窗口内最大请求数
  windowMs: number;        // 时间窗口（毫秒）
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 60 * 1000, // 1分钟
};

/**
 * 检查是否超过限流
 * @param identifier - 用户ID或IP地址
 * @param config - 限流配置
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const { maxRequests, windowMs } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();

  // 清理过期记录（惰性清理）
  if (requestCounts.size > MAX_ENTRIES) {
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetTime) {
        requestCounts.delete(key);
      }
    }
  }

  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    // 新窗口或窗口已重置
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return { allowed: true, remaining: maxRequests - 1, resetTime: now + windowMs };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetTime: record.resetTime };
  }

  record.count++;
  return { allowed: true, remaining: maxRequests - record.count, resetTime: record.resetTime };
}

// 每5分钟清理过期记录
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Node.js 进程退出时清理定时器
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => clearInterval(cleanupInterval));
  process.on("SIGINT", () => clearInterval(cleanupInterval));
}
