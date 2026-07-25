/**
 * CSRF-safe fetch 封装
 * 自动从 cookie 读取 csrf_token 并附带到 X-CSRF-Token header
 */

function getCsrfToken(): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match?.[1];
}

/**
 * 带 CSRF token 的 fetch
 * 用法与原生 fetch 完全一致，自动处理 token
 */
export async function csrfFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = init?.method?.toUpperCase() ?? "GET";

  // 只有状态变更请求需要附带 token
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const token = getCsrfToken();
    if (token) {
      init = {
        ...init,
        headers: {
          ...init?.headers,
          "X-CSRF-Token": token,
        },
      };
    }
  }

  return fetch(input, init);
}
